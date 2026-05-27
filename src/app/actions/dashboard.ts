"use server";

import { unstable_cache } from "next/cache";
import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { getWeekStartDate } from "@/lib/dates";
import { createServerContainer } from "@/infrastructure/di/container";
import {
  buildActivityFeed,
  type ActivityItem,
} from "@/infrastructure/queries/buildActivityFeed";
import { coachCacheTags } from "@/infrastructure/cache/revalidate-coach-cache";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import type { DashboardStatsDto } from "@/application/dto";

export type { ActivityItem } from "@/infrastructure/queries/buildActivityFeed";

const CACHE_REVALIDATE_SECONDS = 30;

export interface CoachDashboardCacheResult {
  stats: DashboardStatsDto;
  students: CoachStudentRowDto[];
  activities: ActivityItem[];
}

function getCachedCoachDashboard(
  coachId: string
): Promise<CoachDashboardCacheResult> {
  return unstable_cache(
    async () => {
      const container = await createServerContainer();
      const { rows } = await container.loadActiveCoachStudents.execute(coachId);

      if (rows.length === 0) {
        return {
          stats: container.dashboardStats.computeFromCards([]),
          students: [],
          activities: [],
        };
      }

      const studentIds = rows.map((r) => r.id);
      const studentMap = new Map(rows.map((r) => [r.id, r.name]));
      const activitiesRaw = await buildActivityFeed(studentMap, studentIds);
      const activities = activitiesRaw.map((a) => ({
        ...a,
        studentName: studentMap.get(a.studentId) ?? "Öğrenci",
      }));

      return {
        stats: container.dashboardStats.computeFromCards(rows),
        students: rows,
        activities,
      };
    },
    ["coach-dashboard", coachId],
    {
      tags: [
        coachCacheTags.dashboard(coachId),
        coachCacheTags.students(coachId),
        coachCacheTags.activityFeed(coachId),
      ],
      revalidate: CACHE_REVALIDATE_SECONDS,
    }
  )();
}

/** Koç adını admin client ile direkt users tablosundan çeker */
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

export async function getCoachDashboardAction() {
  const { session } = await requireSession();
  if (!session.role.isCoach()) return null;

  return getCachedCoachDashboard(session.userId);
}

export async function getStudentDashboardAction() {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return null;

  const activeEngagement = await container.engagements.findActiveByStudent(
    student.id
  );

  if (!activeEngagement) {
    return {
      name: student.name,
      coachName: null,
      completionPercent: student.taskCompletionRate.percent,
      motivation: null,
      weeklyCompletion: 0,
      totalTasks: 0,
      completedTasks: 0,
      grid: [],
      hasActiveCoach: false,
    };
  }

  const weekStart = getWeekStartDate(new Date());
  const [coachName, program, latestMotivation] = await Promise.all([
    fetchCoachName(activeEngagement.coachId),
    container.getWeeklyProgram.executeForEngagement(activeEngagement, weekStart),
    container.getMotivation.fetchLatest(activeEngagement.id),
  ]);

  const motivation = container.getMotivation.toCardDto(
    latestMotivation ? [latestMotivation] : [],
    coachName
  );

  const grid = program.grid as unknown[][];
  const allCells = grid.flat();
  const totalTasks = allCells.filter(Boolean).length;
  const completedTasks = allCells.filter(
    (c) => c && (c as { done?: boolean }).done
  ).length;

  return {
    name: student.name,
    coachName,
    completionPercent: student.taskCompletionRate.percent,
    motivation,
    weeklyCompletion: program.completionPercent,
    totalTasks,
    completedTasks,
    grid: program.grid,
    hasActiveCoach: true,
  };
}

export async function getCurrentStudentRecordAction() {
  const { container, session } = await requireSession();
  return container.students.findByUserId(session.userId);
}

export async function getCurrentStudentActiveEngagementAction() {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return null;
  return container.engagements.findActiveByStudent(student.id);
}
