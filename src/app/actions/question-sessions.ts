"use server";

import { requireSession } from "./lib";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { revalidateCoachCacheForStudent } from "@/infrastructure/cache/revalidate-coach-cache";
import {
  addDaysISO,
  getWeekStartISO,
  sortByDateDesc,
  todayLocalISO,
} from "@/lib/dates";

function normalizeWeekStart(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const iso = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function parseQuestionSessionWeekRows(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  const weeks: string[] = [];
  for (const row of data) {
    if (typeof row === "string") {
      const week = normalizeWeekStart(row);
      if (week) weeks.push(week);
      continue;
    }
    if (row && typeof row === "object") {
      const week = normalizeWeekStart(
        (row as Record<string, unknown>).week_start
      );
      if (week) weeks.push(week);
    }
  }
  return weeks;
}

async function listQuestionSessionWeeksFallback(
  studentId: string
): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("question_sessions")
    .select("date")
    .eq("student_id", studentId);
  if (error || !data) return [];

  const weeks = new Set<string>();
  for (const row of data) {
    const iso = String(row.date);
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) continue;
    weeks.add(getWeekStartISO(new Date(y, m - 1, d)));
  }
  return [...weeks].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

export interface QuestionSessionDto {
  id: string;
  studentId: string;
  lessonName: string;
  date: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  note: string;
}

/**
 * Verilen hafta (varsayılan: bu hafta) için soru çözüm kayıtlarını döner.
 * Geçmiş haftalara ait kayıtlar artık silinmez, böylece eski haftalar görüntülenebilir.
 */
export async function listQuestionSessionsAction(
  studentId: string,
  weekStart?: string
): Promise<QuestionSessionDto[]> {
  await requireSession();
  const supabase = await createSupabaseServerClient();
  const week = weekStart || getWeekStartISO();
  const weekEnd = addDaysISO(week, 6);

  const { data, error } = await supabase
    .from("question_sessions")
    .select(
      "id, student_id, lesson_name, date, total, correct, wrong, blank, note, created_at"
    )
    .eq("student_id", studentId)
    .gte("date", week)
    .lte("date", weekEnd)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const items = data.map((r) => ({
    id: String(r.id),
    studentId: String(r.student_id),
    lessonName: String(r.lesson_name),
    date: String(r.date),
    total: Number(r.total),
    correct: Number(r.correct),
    wrong: Number(r.wrong),
    blank: Number(r.blank),
    note: String(r.note ?? ""),
    createdAt: String(r.created_at ?? ""),
  }));
  return sortByDateDesc(
    items,
    (s) => s.date,
    (s) => s.createdAt
  ).map(({ createdAt: _, ...rest }) => rest);
}

/**
 * Öğrencinin soru çözüm kaydı yaptığı haftaların listesi (yeni → eski).
 * Her bir kayıt YYYY-MM-DD biçiminde Pazartesi tarihidir.
 */
export async function listQuestionSessionWeeksAction(
  studentId: string
): Promise<string[]> {
  await requireSession();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_question_session_weeks", {
    p_student_id: studentId,
  });
  if (error) return listQuestionSessionWeeksFallback(studentId);
  const weeks = parseQuestionSessionWeekRows(data);
  if (weeks.length === 0 && Array.isArray(data) && data.length > 0) {
    return listQuestionSessionWeeksFallback(studentId);
  }
  return weeks;
}

export async function createQuestionSessionAction(input: {
  studentId: string;
  lessonName: string;
  date: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  note?: string;
}): Promise<QuestionSessionDto> {
  const { container } = await requireSession();
  const supabase = await createSupabaseServerClient();
  const weekStart = getWeekStartISO();
  if (input.date > todayLocalISO()) {
    throw new Error("Gelecek bir tarih için soru çözüm kaydı eklenemez.");
  }
  const engagement = await container.engagements.findActiveByStudent(
    input.studentId
  );
  if (!engagement) {
    throw new Error("Aktif bir koçluk ilişkisi olmadan soru çözüm kaydı yapılamaz.");
  }
  const { data, error } = await supabase
    .from("question_sessions")
    .insert({
      engagement_id: engagement.id,
      student_id: input.studentId,
      lesson_name: input.lessonName,
      date: input.date,
      total: input.total,
      correct: input.correct,
      wrong: input.wrong,
      blank: input.blank,
      note: input.note ?? "",
    })
    .select(
      "id, student_id, lesson_name, date, total, correct, wrong, blank, note"
    )
    .single();
  if (error || !data) throw new Error(error?.message ?? "Kayıt eklenemedi");
  try {
    await container.students.touchLastActive(input.studentId);
  } catch {
    // Kayıt başarılı; son aktiflik güncellenemese de devam et
  }
  await revalidateCoachCacheForStudent(input.studentId);
  return {
    id: String(data.id),
    studentId: String(data.student_id),
    lessonName: String(data.lesson_name),
    date: String(data.date),
    total: Number(data.total),
    correct: Number(data.correct),
    wrong: Number(data.wrong),
    blank: Number(data.blank),
    note: String(data.note ?? ""),
  };
}

export async function deleteQuestionSessionAction(id: string): Promise<void> {
  await requireSession();
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("question_sessions")
    .select("student_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Kayıt bulunamadı.");

  const { error } = await supabase
    .from("question_sessions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateCoachCacheForStudent(String(existing.student_id));
}
