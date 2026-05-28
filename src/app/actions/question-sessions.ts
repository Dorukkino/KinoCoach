"use server";

import { after } from "next/server";
import { requireSession } from "./lib";
import { revalidateCoachCacheForStudent } from "@/infrastructure/cache/revalidate-coach-cache";
import { todayLocalISO } from "@/lib/dates";
import { measureAction } from "@/infrastructure/performance/measureAction";
import { getQuestionSessionRepository } from "@/infrastructure/repositories/questionSessionRepository.server";
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
  return measureAction("listQuestionSessionsAction", async () => {
    await requireSession();
    const repo = await getQuestionSessionRepository();
    const page = await repo.findByStudentAndWeek(studentId, weekStart);
    return page.items;
  });
}

export async function listQuestionSessionWeeksAction(
  studentId: string
): Promise<string[]> {
  return measureAction("listQuestionSessionWeeksAction", async () => {
    await requireSession();
    const repo = await getQuestionSessionRepository();
    return repo.findWeeksByStudent(studentId);
  });
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
  return measureAction("createQuestionSessionAction", async () => {
    const { container } = await requireSession();
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

    const repo = await getQuestionSessionRepository();
    let session;
    try {
      session = await repo.create({
        engagementId: engagement.id,
        studentId: input.studentId,
        lessonName: input.lessonName,
        date,
        total: input.total,
        correct: input.correct,
        wrong: input.wrong,
        blank: input.blank,
        note: input.note,
      });
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Kayıt eklenemedi",
      };
    }

    try {
      await container.students.touchLastActive(input.studentId);
    } catch {
      // ignore
    }

    if (container.sendNotification) {
      try {
        const student = await container.students.findById(input.studentId);
        if (student) {
          const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(
            "tr-TR"
          );
          await container.sendNotification.execute({
            userId: engagement.coachId,
            title: "Yeni soru çözüm kaydı",
            message: `${student.name} ${dateLabel} tarihinde ${input.lessonName} için soru çözüm ekledi (${input.total} soru, ${input.correct}D ${input.wrong}Y ${input.blank}B).`,
            type: NotificationType.QUESTION_SESSION_CREATED,
            metadata: {
              studentId: input.studentId,
              sessionId: session.id,
              href: "/coach/lesson-nets",
            },
          });
        }
      } catch {
        // ignore
      }
    }

    after(async () => {
      await revalidateCoachCacheForStudent(input.studentId);
    });

    return { ok: true, session };
  });
}

export async function deleteQuestionSessionAction(id: string): Promise<void> {
  return measureAction("deleteQuestionSessionAction", async () => {
    const { container } = await requireSession();
    const repo = await getQuestionSessionRepository();
    const studentId = await repo.findStudentId(id);
    if (!studentId) throw new Error("Kayıt bulunamadı.");

    const engagement = await container.engagements.findActiveByStudent(studentId);
    await repo.delete(id);

    if (container.sendNotification && engagement) {
      try {
        const student = await container.students.findById(studentId);
        if (student) {
          await container.sendNotification.execute({
            userId: engagement.coachId,
            title: "Soru çözüm kaydı silindi",
            message: `${student.name} bir soru çözüm kaydını sildi.`,
            type: NotificationType.QUESTION_SESSION_DELETED,
            metadata: {
              studentId,
              sessionId: id,
              href: "/coach/lesson-nets",
            },
          });
        }
      } catch {
        // ignore
      }
    }

    after(async () => {
      await revalidateCoachCacheForStudent(studentId);
    });
  });
}
