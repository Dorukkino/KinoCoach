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
import type { DashboardStatsDto, MotivationCardDto } from "@/application/dto";

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
    const { container, session } = await requireSession();
    const student = await container.students.findByUserId(session.userId);
    if (!student) {
      return { dashboard: null, invitations: [] as Awaited<
        ReturnType<typeof import("./invitations").listMyPendingInvitationsAction>
      > };
    }

    const activeEngagement = await container.engagements.findActiveByStudent(
      student.id
    );

    let dashboard: Awaited<ReturnType<typeof getStudentDashboardAction>>;
    if (!activeEngagement) {
      dashboard = {
        studentId: student.id,
        name: student.name,
        coachName: null,
        motivation: null,
        hasActiveCoach: false,
      };
    } else {
      const [coachName, latestMotivation] = await Promise.all([
        fetchCoachName(activeEngagement.coachId),
        container.getMotivation.fetchLatest(activeEngagement.id),
      ]);
      const motivation = container.getMotivation.toCardDto(
        latestMotivation ? [latestMotivation] : [],
        coachName
      );
      dashboard = {
        studentId: student.id,
        name: student.name,
        coachName,
        motivation,
        hasActiveCoach: true,
      };
    }

    const invitations = await container.invitations.findPendingForStudent(
      student.id
    );
    if (invitations.length === 0) {
      return { dashboard, invitations: [] };
    }

    const coachIds = Array.from(new Set(invitations.map((i) => i.coachId)));
    const admin = createSupabaseAdminClient();
    const { data: coachRows } = await admin
      .from("users")
      .select("id, full_name, email")
      .in("id", coachIds);
    const coachNames = new Map<string, string>();
    for (const row of coachRows ?? []) {
      const full = String(row.full_name ?? "").trim();
      const email = String(row.email ?? "");
      coachNames.set(String(row.id), full || email.split("@")[0] || "Koç");
    }

    return {
      dashboard,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        studentId: inv.studentId,
        studentName: student.name,
        coachId: inv.coachId,
        coachName: coachNames.get(inv.coachId) ?? "Koç",
        status: inv.status,
        token: inv.token,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
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
