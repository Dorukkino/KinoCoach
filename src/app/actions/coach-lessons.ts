"use server";

import { requireSession } from "./lib";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

export interface CoachLesson {
  id: string;
  name: string;
}

/** Koçun userId'sini döner — koçsa kendisi, öğrenciyse aktif engagement'taki koç */
async function resolveCoachId(
  userId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<string> {
  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userRow?.role === "coach") return userId;

  // Öğrenciyse aktif engagement üzerinden koçu bul
  const { data: studentRow } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!studentRow?.id) return userId;

  const { data: engagement } = await supabase
    .from("coaching_engagements")
    .select("coach_id")
    .eq("student_id", studentRow.id)
    .eq("status", "active")
    .maybeSingle();

  return engagement?.coach_id ?? userId;
}

export async function getCoachLessonsAction(): Promise<CoachLesson[]> {
  const { session } = await requireSession();
  const supabase = await createSupabaseServerClient();
  const coachId = await resolveCoachId(session.userId, supabase);
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
  const supabase = await createSupabaseServerClient();
  const coachId = await resolveCoachId(session.userId, supabase);
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
  const supabase = await createSupabaseServerClient();
  const coachId = await resolveCoachId(session.userId, supabase);

  // Önce bu dersin gerçekten bu koça ait olduğunu doğrula
  const { data: existing } = await supabase
    .from("coach_lessons")
    .select("id")
    .eq("id", id)
    .eq("coach_id", coachId)
    .single();
  if (!existing) throw new Error("Ders bulunamadı veya yetkiniz yok");

  // Update — select zinciri olmadan
  const { error } = await supabase
    .from("coach_lessons")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Güncel veriyi ayrı sorguda çek
  const { data, error: fetchError } = await supabase
    .from("coach_lessons")
    .select("id, name")
    .eq("id", id)
    .single();
  if (fetchError || !data) throw new Error(fetchError?.message ?? "Ders güncellenemedi");
  return data as CoachLesson;
}

export async function deleteCoachLessonAction(id: string): Promise<void> {
  await requireSession();
  // Anon client RLS'de DELETE iznine sahip olmayabilir — admin client kullan
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("coach_lessons")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
