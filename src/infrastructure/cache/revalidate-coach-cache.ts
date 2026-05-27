import "server-only";
import { revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

export const coachCacheTags = {
  students: (coachId: string) => `coach-students-${coachId}`,
  archived: (coachId: string) => `coach-archived-${coachId}`,
  dashboard: (coachId: string) => `coach-dashboard-${coachId}`,
  notes: (coachId: string) => `coach-notes-${coachId}`,
  activityFeed: (coachId: string) => `coach-activity-${coachId}`,
} as const;

export function revalidateCoachStudents(coachId: string) {
  revalidateTag(coachCacheTags.students(coachId));
}

export function revalidateCoachArchived(coachId: string) {
  revalidateTag(coachCacheTags.archived(coachId));
}

export function revalidateCoachNotes(coachId: string) {
  revalidateTag(coachCacheTags.notes(coachId));
}

export function revalidateCoachActivityFeed(coachId: string) {
  revalidateTag(coachCacheTags.activityFeed(coachId));
}

export function revalidateCoachDashboard(coachId: string) {
  revalidateTag(coachCacheTags.dashboard(coachId));
  revalidateTag(coachCacheTags.activityFeed(coachId));
  revalidateTag(coachCacheTags.students(coachId));
}

export function revalidateCoachStudentLists(coachId: string) {
  revalidateCoachStudents(coachId);
  revalidateCoachArchived(coachId);
  revalidateCoachDashboard(coachId);
}

export async function revalidateCoachCacheForStudent(studentId: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("coaching_engagements")
      .select("coach_id")
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (data?.coach_id) {
      revalidateCoachDashboard(String(data.coach_id));
    }
  } catch {
    // Cache expires via revalidate fallback
  }
}
