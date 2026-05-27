import "server-only";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  addDaysISO,
  getWeekStartForISO,
  getWeekStartISO,
  sortByDateDesc,
} from "@/lib/dates";
import type { QuestionSessionDto } from "./question-sessions.types";

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

async function fetchQuestionSessionWeeksFallback(
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
    const iso = String(row.date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
    weeks.add(getWeekStartForISO(iso));
  }
  return [...weeks].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

export async function fetchQuestionSessions(
  studentId: string,
  weekStart?: string
): Promise<QuestionSessionDto[]> {
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
    date: String(r.date).slice(0, 10),
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
  ).map(({ createdAt: _createdAt, ...rest }) => rest);
}

export async function fetchQuestionSessionWeeks(
  studentId: string
): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_question_session_weeks", {
    p_student_id: studentId,
  });
  if (error) return fetchQuestionSessionWeeksFallback(studentId);
  const weeks = parseQuestionSessionWeekRows(data);
  if (weeks.length === 0 && Array.isArray(data) && data.length > 0) {
    return fetchQuestionSessionWeeksFallback(studentId);
  }
  return weeks;
}
