import "server-only";
import { revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { coachCacheTags } from "./coach-cache";

export function revalidateCoachStudents(coachId: string) {
  revalidateTag(coachCacheTags.students(coachId));
}

export function revalidateCoachArchived(coachId: string) {
  revalidateTag(coachCacheTags.archived(coachId));
}

export function revalidateCoachStudentLists(coachId: string) {
  revalidateCoachStudents(coachId);
  revalidateCoachArchived(coachId);
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
      revalidateCoachStudents(String(data.coach_id));
    }
  } catch {
    // Cache expires via revalidate fallback
  }
}
