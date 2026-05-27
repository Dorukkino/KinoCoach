import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IWeeklyProgramRepository } from "../ports/IWeeklyProgramRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { INotificationRepository } from "../ports/INotificationRepository";
import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";
import { getWeekStartISO, todayLocalISO } from "@/lib/dates";

const COMPLETION_THRESHOLD = 30;

export class SendWeeklyReminderUseCase {
  constructor(
    private readonly engagements: IEngagementRepository,
    private readonly programs: IWeeklyProgramRepository,
    private readonly students: IStudentRepository,
    private readonly sendNotification: SendNotificationUseCase,
    private readonly notifications: INotificationRepository
  ) {}

  async execute(): Promise<{ sent: number }> {
    if (!this.isMidWeekOrLater()) return { sent: 0 };

    const weekStart = getWeekStartISO();
    const weekStartDate = new Date(`${weekStart}T12:00:00+03:00`);
    const activeEngagements = await this.engagements.findAllActive();
    let sent = 0;

    for (const engagement of activeEngagements) {
      const student = await this.students.findById(engagement.studentId);
      if (!student) continue;

      const alreadySent = await this.notifications.existsByTypeAndMetadata(
        student.userId,
        NotificationType.WEEKLY_REMINDER,
        "weekStart",
        weekStart
      );
      if (alreadySent) continue;

      const program = await this.programs.findByEngagementAndWeek(
        engagement.id,
        weekStartDate
      );
      const completionPercent = program?.completionRate().percent ?? 0;
      if (completionPercent >= COMPLETION_THRESHOLD) continue;

      await this.sendNotification.execute({
        userId: student.userId,
        title: "Haftalık program hatırlatması",
        message:
          "Bu haftaki programını henüz tamamlamadın. Görevlerini tamamlamayı unutma!",
        type: NotificationType.WEEKLY_REMINDER,
        metadata: {
          weekStart,
          studentId: student.id,
          engagementId: engagement.id,
          href: "/student/weekly",
        },
      });
      sent += 1;
    }

    return { sent };
  }

  /** Çarşamba ve sonrası (Pazartesi = 0) */
  private isMidWeekOrLater(): boolean {
    const today = todayLocalISO();
    const ref = new Date(`${today}T12:00:00+03:00`);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Istanbul",
      weekday: "short",
    }).format(ref);
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dow = map[weekday] ?? 1;
    const daysSinceMonday = dow === 0 ? 6 : dow - 1;
    return daysSinceMonday >= 2;
  }
}
