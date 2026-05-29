"use server";

import { unstable_cache } from "next/cache";
import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { createAdminContainer } from "@/infrastructure/di/container";
import {
  buildActivityFeed,
  type ActivityItem,
} from "@/infrastructure/queries/buildActivityFeed";
import { fetchCoachActivityFeedViaRpc } from "@/infrastructure/queries/fetchCoachActivityFeedViaRpc";
import { coachCacheTags } from "@/infrastructure/cache/revalidate-coach-cache";
import { measureAction } from "@/infrastructure/performance/measureAction";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import type {
  CoachingInvitationDto,
  DashboardStatsDto,
  MotivationCardDto,
} from "@/application/dto";

export type { ActivityItem } from "@/infrastructure/queries/buildActivityFeed";

const CACHE_REVALIDATE_SECONDS = 30;

export interface CoachDashboardCacheResult {
  stats: DashboardStatsDto;
  students: CoachStudentRowDto[];
  activities: ActivityItem[];
}

function getCachedCoachStudents(coachId: string): Promise<CoachStudentRowDto[]> {
  return unstable_cache(
    async () => {
      const container = createAdminContainer();
      const { rows } = await container.loadActiveCoachStudents.execute(coachId);
      return rows;
    },
    ["coach-dashboard-students", coachId],
    {
      tags: [coachCacheTags.students(coachId), coachCacheTags.dashboard(coachId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    }
  )();
}

function getCachedCoachStats(coachId: string): Promise<DashboardStatsDto> {
  return unstable_cache(
    async () => {
      const container = createAdminContainer();
      const { rows } = await container.loadActiveCoachStudents.execute(coachId);
      return container.dashboardStats.computeFromCards(rows);
    },
    ["coach-dashboard-stats", coachId],
    {
      tags: [coachCacheTags.dashboard(coachId), coachCacheTags.students(coachId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    }
  )();
}

function getCachedCoachActivityFeed(coachId: string): Promise<ActivityItem[]> {
  return unstable_cache(
    async () => {
      const container = createAdminContainer();
      const { rows } = await container.loadActiveCoachStudents.execute(coachId);
      if (rows.length === 0) return [];

      const studentIds = rows.map((r) => r.id);
      const studentMap = new Map(rows.map((r) => [r.id, r.name]));

      try {
        return await fetchCoachActivityFeedViaRpc(coachId, studentMap);
      } catch {
        const activitiesRaw = await buildActivityFeed(studentMap, studentIds);
        return activitiesRaw.map((a) => ({
          ...a,
          studentName: studentMap.get(a.studentId) ?? "Öğrenci",
        }));
      }
    },
    ["coach-dashboard-activity", coachId],
    {
      tags: [coachCacheTags.activityFeed(coachId), coachCacheTags.dashboard(coachId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    }
  )();
}

async function fetchCoachName(coachId: string): Promise<string> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", coachId)
      .maybeSingle();
    if (data?.full_name && data.full_name.trim()) return data.full_name.trim();
    if (data?.email) return data.email.split("@")[0];
  } catch {
    // ignore
  }
  return "Koçunuz";
}

function resolveCoachName(row: unknown, fallback = "Koç"): string {
  const data = row as { full_name?: unknown; email?: unknown } | null;
  const fullName = String(data?.full_name ?? "").trim();
  if (fullName) return fullName;
  const email = String(data?.email ?? "");
  return email.split("@")[0] || fallback;
}

function toMotivationCard(
  row: { message?: unknown; created_at?: unknown } | null | undefined,
  coachName: string
): MotivationCardDto | null {
  if (!row) return null;
  return {
    message: String(row.message ?? ""),
    coachName,
    createdAt: String(row.created_at),
  };
}

export async function getCoachDashboardStudentsAction() {
  return measureAction("getCoachDashboardStudentsAction", async () => {
    const { session } = await requireSession();
    if (!session.role.isCoach()) return [];
    return getCachedCoachStudents(session.userId);
  });
}

export async function getCoachDashboardStatsAction() {
  return measureAction("getCoachDashboardStatsAction", async () => {
    const { session } = await requireSession();
    if (!session.role.isCoach()) return null;
    return getCachedCoachStats(session.userId);
  });
}

export async function getCoachActivityFeedAction() {
  return measureAction("getCoachActivityFeedAction", async () => {
    const { session } = await requireSession();
    if (!session.role.isCoach()) return [];
    return getCachedCoachActivityFeed(session.userId);
  });
}

export async function getCoachDashboardAction(): Promise<CoachDashboardCacheResult | null> {
  return measureAction("getCoachDashboardAction", async () => {
    const { session } = await requireSession();
    if (!session.role.isCoach()) return null;

    const [students, stats, activities] = await Promise.all([
      getCachedCoachStudents(session.userId),
      getCachedCoachStats(session.userId),
      getCachedCoachActivityFeed(session.userId),
    ]);

    return { stats, students, activities };
  });
}

export async function getStudentDashboardAction() {
  return measureAction("getStudentDashboardAction", async () => {
    const { container, session } = await requireSession();
    const student = await container.students.findByUserId(session.userId);
    if (!student) return null;

    const activeEngagement = await container.engagements.findActiveByStudent(
      student.id
    );

    if (!activeEngagement) {
      return {
        studentId: student.id,
        name: student.name,
        coachName: null,
        motivation: null,
        hasActiveCoach: false,
      };
    }

    const [coachName, latestMotivation] = await Promise.all([
      fetchCoachName(activeEngagement.coachId),
      container.getMotivation.fetchLatest(activeEngagement.id),
    ]);

    const motivation = container.getMotivation.toCardDto(
      latestMotivation ? [latestMotivation] : [],
      coachName
    );

    return {
      studentId: student.id,
      name: student.name,
      coachName,
      motivation,
      hasActiveCoach: true,
    };
  });
}

export async function getStudentDashboardWithInvitationsAction() {
  return measureAction("getStudentDashboardWithInvitationsAction", async () => {
    const { session } = await requireSession();
    const admin = createSupabaseAdminClient();

    const { data: student } = await admin
      .from("students")
      .select("id, name")
      .eq("user_id", session.userId)
      .maybeSingle();

    if (!student) {
      return { dashboard: null, invitations: [] as CoachingInvitationDto[] };
    }

    const studentId = String(student.id);
    const studentName = String(student.name);

    const [engagementResult, invitationsResult] = await Promise.all([
      admin
        .from("coaching_engagements")
        .select("id, coach_id")
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle(),
      admin
        .from("coaching_invitations")
        .select("id, student_id, coach_id, status, token, expires_at, created_at")
        .eq("student_id", studentId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    const activeEngagement = engagementResult.data;
    const invitations = invitationsResult.data ?? [];
    const coachIds = Array.from(
      new Set([
        ...invitations.map((i) => String(i.coach_id)),
        ...(activeEngagement ? [String(activeEngagement.coach_id)] : []),
      ])
    );

    const [motivationResult, coachRowsResult] = await Promise.all([
      activeEngagement
        ? admin
            .from("motivation_messages")
            .select("message, created_at")
            .eq("engagement_id", String(activeEngagement.id))
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      coachIds.length > 0
        ? admin
            .from("users")
            .select("id, full_name, email")
            .in("id", coachIds)
        : Promise.resolve({ data: [] }),
    ]);

    const coachNames = new Map<string, string>();
    for (const row of coachRowsResult.data ?? []) {
      coachNames.set(String(row.id), resolveCoachName(row));
    }

    const coachId = activeEngagement
      ? String(activeEngagement.coach_id)
      : null;
    const coachName = coachId
      ? coachNames.get(coachId) ?? "Koçunuz"
      : null;
    const dashboard = {
      studentId,
      name: studentName,
      coachName,
      motivation:
        activeEngagement && coachName
          ? toMotivationCard(motivationResult.data, coachName)
          : null,
      hasActiveCoach: Boolean(activeEngagement),
    };

    if (invitations.length === 0) {
      return { dashboard, invitations: [] };
    }

    if (coachNames.size === 0) {
      const { data: coachRows } = await admin
        .from("users")
        .select("id, full_name, email")
        .in("id", coachIds);
      for (const row of coachRows ?? []) {
        coachNames.set(String(row.id), resolveCoachName(row));
      }
    }

    return {
      dashboard,
      invitations: invitations.map((inv) => ({
        id: String(inv.id),
        studentId: String(inv.student_id),
        studentName,
        coachId: String(inv.coach_id),
        coachName: coachNames.get(String(inv.coach_id)) ?? "Koç",
        status: String(inv.status) as CoachingInvitationDto["status"],
        token: String(inv.token),
        expiresAt: String(inv.expires_at),
        createdAt: String(inv.created_at),
      })),
    };
  });
}

export async function getStudentMotivationAction(): Promise<MotivationCardDto | null> {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return null;

  const activeEngagement = await container.engagements.findActiveByStudent(
    student.id
  );
  if (!activeEngagement) return null;

  const coachName = await fetchCoachName(activeEngagement.coachId);
  const latestMotivation = await container.getMotivation.fetchLatest(
    activeEngagement.id
  );
  return container.getMotivation.toCardDto(
    latestMotivation ? [latestMotivation] : [],
    coachName
  );
}

export async function getCurrentStudentRecordAction() {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return null;
  return {
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email.value,
    taskCompletionRate: student.taskCompletionRate.percent,
    lastActiveAt: student.lastActiveAt
      ? student.lastActiveAt.toISOString()
      : null,
    grade: student.grade,
    track: student.track,
  };
}

export async function getCurrentStudentActiveEngagementAction() {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return null;
  const engagement = await container.engagements.findActiveByStudent(student.id);
  if (!engagement) return null;
  return {
    id: engagement.id,
    coachId: engagement.coachId,
    studentId: engagement.studentId,
    status: engagement.status.value,
    schoolLevel: engagement.schoolLevel,
    startedAt: engagement.startedAt.toISOString(),
    endedAt: engagement.endedAt ? engagement.endedAt.toISOString() : null,
  };
}
