import { IMotivationRepository } from "../ports/IMotivationRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";
import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";

export class SetMotivationMessageUseCase {
  constructor(
    private readonly motivation: IMotivationRepository,
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository,
    private readonly sendNotification?: SendNotificationUseCase
  ) {}

  async execute(coachId: string, studentId: string, message: string) {
    const engagement = await this.engagements.findActiveByCoachAndStudent(
      coachId,
      studentId
    );
    if (!engagement) throw new NoActiveEngagementError();

    const result = await this.motivation.create(
      engagement.id,
      coachId,
      studentId,
      message
    );

    if (this.sendNotification) {
      try {
        const student = await this.students.findById(studentId);
        if (student) {
          await this.sendNotification.execute({
            userId: student.userId,
            title: "Koçunuzdan motivasyon mesajı",
            message: message.slice(0, 200),
            type: NotificationType.NEW_MOTIVATION,
            metadata: {
              coachId,
              studentId,
              engagementId: engagement.id,
              href: "/student/dashboard",
            },
          });
        }
      } catch {
        // Bildirim hatası motivasyon kaydını geri almaz
      }
    }

    return result;
  }
}
