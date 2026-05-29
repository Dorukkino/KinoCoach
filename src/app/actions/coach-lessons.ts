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

  const { data: studentRow } = await supabase
    .from("students")
    .select("id, coaching_engagements!inner(coach_id)")
    .eq("user_id", userId)
    .eq("coaching_engagements.status", "active")
    .maybeSingle();

  if (!studentRow) return userId;

  const engagements = studentRow.coaching_engagements as
    | { coach_id: string }
    | { coach_id: string }[]
    | null
    | undefined;
  const engagement = Array.isArray(engagements) ? engagements[0] : engagements;
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
  const { data, error } = await supabase
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
  const server = await createSupabaseServerClient();
  const coachId = await resolveCoachId(session.userId, server);
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
