import { ILessonNetRepository } from "../ports/ILessonNetRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { LessonNetDto } from "../dto";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";
import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";

export class UpsertLessonNetUseCase {
  constructor(
    private readonly lessonNets: ILessonNetRepository,
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository,
    private readonly sendNotification?: SendNotificationUseCase
  ) {}

  async execute(input: {
    studentId: string;
    weekStart: Date;
    grid: Grid7x10;
  }): Promise<LessonNetDto> {
    const engagement = await this.engagements.findActiveByStudent(
      input.studentId
    );
    if (!engagement) throw new NoActiveEngagementError();

    const net = await this.lessonNets.upsert(
      engagement.id,
      input.studentId,
      input.weekStart,
      input.grid
    );
    await this.students.touchLastActive(input.studentId);

    if (this.sendNotification) {
      try {
        const student = await this.students.findById(input.studentId);
        if (student) {
          const weekStart = input.weekStart.toISOString().slice(0, 10);
          await this.sendNotification.execute({
            userId: engagement.coachId,
            title: "Ders netleri güncellendi",
            message: `${student.name} ders netlerini güncelledi.`,
            type: NotificationType.LESSON_NET_UPDATED,
            metadata: {
              studentId: input.studentId,
              weekStart,
              href: "/coach/lesson-nets",
            },
          });
        }
      } catch {
        // Bildirim hatası net kaydını geri almaz
      }
    }

    return {
      id: net.id,
      studentId: net.studentId,
      weekStart: net.weekStart.toISOString().slice(0, 10),
      grid: net.grid.toJSON(),
    };
  }
}
