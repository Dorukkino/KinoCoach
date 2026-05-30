"use server";

import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

export interface CoachLesson {
  id: string;
  name: string;
}

/** Koçun userId'sini döner — koçsa kendisi, öğrenciyse aktif engagement'taki koç */
async function resolveCoachId(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data: userRow, error: userError } = await admin
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw new Error(userError.message);
  if (userRow?.role === "coach") return userId;

  const { data: studentRow, error: studentError } = await admin
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (studentError) throw new Error(studentError.message);
  if (!studentRow) return null;

  const { data: engagement, error: engagementError } = await admin
    .from("coaching_engagements")
    .select("coach_id")
    .eq("student_id", studentRow.id)
    .eq("status", "active")
    .maybeSingle();

  if (engagementError) throw new Error(engagementError.message);
  return engagement?.coach_id ?? null;
}

export async function getCoachLessonsAction(): Promise<CoachLesson[]> {
  const { session } = await requireSession();
  const coachId = await resolveCoachId(session.userId);
  if (!coachId) return [];
  // Admin client ile çek — RLS SELECT kısıtlamalarını bypass et
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("coach_lessons")
    .select("id, name")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as CoachLesson[];
}

export async function addCoachLessonAction(name: string): Promise<CoachLesson> {
  const { session } = await requireSession();
  const coachId = await resolveCoachId(session.userId);
  if (!coachId) {
    throw new Error("Aktif koçluk ilişkisi olmadan ders eklenemez.");
  }
  // Admin client ile ekle — RLS INSERT kısıtlamalarını bypass et
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("coach_lessons")
    .insert({ coach_id: coachId, name: name.trim() })
    .select("id, name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Ders eklenemedi");
  return data as CoachLesson;
}

export async function updateCoachLessonAction(id: string, name: string): Promise<CoachLesson> {
  const { session } = await requireSession();
  const coachId = await resolveCoachId(session.userId);
  if (!coachId) throw new Error("Aktif koçluk ilişkisi bulunamadı.");
  const admin = createSupabaseAdminClient();

  // Önce bu dersin gerçekten bu koça ait olduğunu doğrula
  const { data: existing } = await admin
    .from("coach_lessons")
    .select("id")
    .eq("id", id)
    .eq("coach_id", coachId)
    .single();
  if (!existing) throw new Error("Ders bulunamadı veya yetkiniz yok");

  // Update — select zinciri olmadan
  const { data, error } = await admin
    .from("coach_lessons")
    .update({ name: name.trim() })
    .eq("id", id)
    .select("id, name")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Ders güncellenemedi");
  return data as CoachLesson;
}

export async function deleteCoachLessonAction(id: string): Promise<void> {
  const { session } = await requireSession();
  const coachId = await resolveCoachId(session.userId);
  if (!coachId) throw new Error("Aktif koçluk ilişkisi bulunamadı.");
  const admin = createSupabaseAdminClient();

  const { data: existing, error: lookupError } = await admin
    .from("coach_lessons")
    .select("id")
    .eq("id", id)
    .eq("coach_id", coachId)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (!existing) throw new Error("Ders bulunamadı veya yetkiniz yok");

  const { error } = await admin
    .from("coach_lessons")
    .delete()
    .eq("id", id)
    .eq("coach_id", coachId);
  if (error) throw new Error(error.message);
}
