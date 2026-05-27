"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "./lib";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  addDaysISO,
  getWeekStartISO,
  sortByDateDesc,
  todayLocalISO,
} from "@/lib/dates";

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
    const dt = new Date(y, m - 1, d);
    // Pazartesi başlangıcına snap
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    dt.setDate(diff);
    const wy = dt.getFullYear();
    const wm = String(dt.getMonth() + 1).padStart(2, "0");
    const wd = String(dt.getDate()).padStart(2, "0");
    weeks.add(`${wy}-${wm}-${wd}`);
  }
  return Array.from(weeks).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
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
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Kayıt eklenemedi");
  await container.students.touchLastActive(input.studentId);
  revalidatePath("/student/lesson-nets");
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
  const { error } = await supabase
    .from("question_sessions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/student/lesson-nets");
}
