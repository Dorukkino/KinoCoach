import { IExamResultRepository } from "../ports/IExamResultRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { ExamScoresProps } from "@/domain/value-objects/ExamScores";
import { ExamResultDto } from "../dto";
import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";

export type ExamResultCreatedBy = "coach" | "student";

export class UpdateExamResultUseCase {
  constructor(
    private readonly exams: IExamResultRepository,
    private readonly students: IStudentRepository,
    private readonly engagements: IEngagementRepository,
    private readonly sendNotification?: SendNotificationUseCase
  ) {}

  async create(
    studentId: string,
    date: Date,
    scores: ExamScoresProps,
    note = "",
    createdBy: ExamResultCreatedBy = "coach"
  ): Promise<ExamResultDto> {
    const result = await this.exams.create(studentId, date, scores, note);
    await this.students.touchLastActive(studentId);

    if (this.sendNotification) {
      try {
        const student = await this.students.findById(studentId);
        if (!student) return this.toDto(result);

        const total =
          scores.turkish +
          scores.math +
          scores.science +
          scores.social +
          (scores.english ?? 0);
        const dateLabel = date.toLocaleDateString("tr-TR");

        if (createdBy === "coach") {
          await this.sendNotification.execute({
            userId: student.userId,
            title: "Yeni deneme sonucunuz eklendi",
            message: `${dateLabel} tarihli deneme sonucunuz koçunuz tarafından kaydedildi. Toplam net: ${total}.`,
            type: NotificationType.NEW_EXAM_RESULT,
            metadata: {
              studentId,
              examResultId: result.id,
              href: "/student/exams",
            },
          });
        } else {
          const engagement = await this.engagements.findActiveByStudent(studentId);
          if (!engagement) throw new NoActiveEngagementError();

          await this.sendNotification.execute({
            userId: engagement.coachId,
            title: "Öğrenci deneme sonucu ekledi",
            message: `${student.name} ${dateLabel} tarihli deneme sonucunu ekledi. Toplam net: ${total}.`,
            type: NotificationType.NEW_EXAM_RESULT,
            metadata: {
              studentId,
              examResultId: result.id,
              href: `/coach/students/${studentId}`,
            },
          });
        }
      } catch {
        // Bildirim hatası sınav kaydını geri almaz
      }
    }

    return this.toDto(result);
  }

  async update(
    id: string,
    scores: ExamScoresProps,
    date?: Date,
    note?: string
  ): Promise<ExamResultDto> {
    const result = await this.exams.update(id, scores, date, note);
    await this.students.touchLastActive(result.studentId);
    return this.toDto(result);
  }

  async delete(id: string): Promise<void> {
    await this.exams.delete(id);
  }

  private toDto(result: {
    id: string;
    studentId: string;
    date: Date;
    scores: { turkish: number; math: number; science: number; social: number; english?: number | null };
    note: string;
  }): ExamResultDto {
    const eng = result.scores.english ?? null;
    return {
      id: result.id,
      studentId: result.studentId,
      date: result.date.toISOString().slice(0, 10),
      turkish: result.scores.turkish,
      math: result.scores.math,
      science: result.scores.science,
      social: result.scores.social,
      english: eng,
      total: result.scores.turkish + result.scores.math + result.scores.science + result.scores.social + (eng ?? 0),
      note: result.note,
    };
  }
}
