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
import { NotificationType } from "@/domain/value-objects/NotificationType";

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

  if (container.sendNotification) {
    try {
      const student = await container.students.findById(input.studentId);
      if (student) {
        const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR");
        await container.sendNotification.execute({
          userId: engagement.coachId,
          title: "Yeni soru çözüm kaydı",
          message: `${student.name} ${dateLabel} tarihinde ${input.lessonName} için soru çözüm ekledi (${input.total} soru, ${input.correct}D ${input.wrong}Y ${input.blank}B).`,
          type: NotificationType.QUESTION_SESSION_CREATED,
          metadata: {
            studentId: input.studentId,
            sessionId: String(data.id),
            href: "/coach/lesson-nets",
          },
        });
      }
    } catch {
      // Bildirim hatası kaydı geri almaz
    }
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
  const { container } = await requireSession();
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("question_sessions")
    .select("student_id, lesson_name, date")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Kayıt bulunamadı.");

  const studentId = String(existing.student_id);
  const engagement = await container.engagements.findActiveByStudent(studentId);

  const { error } = await supabase
    .from("question_sessions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (container.sendNotification && engagement) {
    try {
      const student = await container.students.findById(studentId);
      if (student) {
        const dateStr = String(existing.date).slice(0, 10);
        const dateLabel = new Date(`${dateStr}T12:00:00`).toLocaleDateString(
          "tr-TR"
        );
        await container.sendNotification.execute({
          userId: engagement.coachId,
          title: "Soru çözüm kaydı silindi",
          message: `${student.name} ${dateLabel} tarihli ${String(existing.lesson_name)} soru çözüm kaydını sildi.`,
          type: NotificationType.QUESTION_SESSION_DELETED,
          metadata: {
            studentId,
            sessionId: id,
            href: "/coach/lesson-nets",
          },
        });
      }
    } catch {
      // Bildirim hatası silmeyi geri almaz
    }
  }

  after(async () => {
    await revalidateCoachCacheForStudent(studentId);
  });
}
