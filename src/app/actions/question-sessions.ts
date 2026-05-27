"use server";

import { after } from "next/server";
import { requireSession } from "./lib";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { revalidateCoachCacheForStudent } from "@/infrastructure/cache/revalidate-coach-cache";
import { todayLocalISO } from "@/lib/dates";
import {
  fetchQuestionSessions,
  fetchQuestionSessionWeeks,
} from "./question-sessions.data";
import type {
  CreateQuestionSessionResult,
  QuestionSessionDto,
} from "./question-sessions.types";

export type { CreateQuestionSessionResult, QuestionSessionDto };

export async function listQuestionSessionsAction(
  studentId: string,
  weekStart?: string
): Promise<QuestionSessionDto[]> {
  await requireSession();
  return fetchQuestionSessions(studentId, weekStart);
}

export async function listQuestionSessionWeeksAction(
  studentId: string
): Promise<string[]> {
  await requireSession();
  return fetchQuestionSessionWeeks(studentId);
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
}): Promise<CreateQuestionSessionResult> {
  const { container } = await requireSession();
  const supabase = await createSupabaseServerClient();
  const date = input.date.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Geçerli bir tarih giriniz." };
  }
  if (date > todayLocalISO()) {
    return {
      ok: false,
      error: "Gelecek bir tarih için soru çözüm kaydı eklenemez.",
    };
  }

  const engagement = await container.engagements.findActiveByStudent(
    input.studentId
  );
  if (!engagement) {
    return {
      ok: false,
      error: "Aktif bir koçluk ilişkisi olmadan soru çözüm kaydı yapılamaz.",
    };
  }

  const { data, error } = await supabase
    .from("question_sessions")
    .insert({
      engagement_id: engagement.id,
      student_id: input.studentId,
      lesson_name: input.lessonName,
      date,
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

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Kayıt eklenemedi" };
  }

  try {
    await container.students.touchLastActive(input.studentId);
  } catch {
    // Kayıt başarılı; son aktiflik güncellenemese de devam et
  }

  after(async () => {
    await revalidateCoachCacheForStudent(input.studentId);
  });

  return {
    ok: true,
    session: {
      id: String(data.id),
      studentId: String(data.student_id),
      lessonName: String(data.lesson_name),
      date: String(data.date).slice(0, 10),
      total: Number(data.total),
      correct: Number(data.correct),
      wrong: Number(data.wrong),
      blank: Number(data.blank),
      note: String(data.note ?? ""),
    },
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

  after(async () => {
    await revalidateCoachCacheForStudent(String(existing.student_id));
  });
}
