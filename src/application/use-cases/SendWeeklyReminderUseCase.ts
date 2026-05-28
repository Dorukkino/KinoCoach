import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";
import { SupabaseWeeklyReminderQuery } from "@/infrastructure/queries/SupabaseWeeklyReminderQuery";
import { getBackgroundConcurrency } from "@/infrastructure/supabase/background";

export class SendWeeklyReminderUseCase {
  constructor(
    private readonly reminderQuery: SupabaseWeeklyReminderQuery,
    private readonly sendNotification: SendNotificationUseCase
  ) {}

  async execute(): Promise<{ sent: number }> {
    if (!this.isMidWeekOrLater()) return { sent: 0 };

    const weekStart = this.reminderQuery.currentWeekStart();
    const candidates = await this.reminderQuery.fetchCandidates(weekStart);
    if (candidates.length === 0) return { sent: 0 };

    let sent = 0;
    const concurrency = getBackgroundConcurrency();

    for (let i = 0; i < candidates.length; i += concurrency) {
      const batch = candidates.slice(i, i + concurrency);
      const results = await Promise.all(
        batch.map(async (candidate) => {
          await this.sendNotification.execute({
            userId: candidate.studentUserId,
            title: "Haftalık program hatırlatması",
            message:
              "Bu haftaki programını henüz tamamlamadın. Görevlerini tamamlamayı unutma!",
            type: NotificationType.WEEKLY_REMINDER,
            metadata: {
              weekStart,
              studentId: candidate.studentId,
              engagementId: candidate.engagementId,
              href: "/student/weekly",
            },
          });
          return true;
        })
      );
      sent += results.filter(Boolean).length;
    }

    return { sent };
  }

  private isMidWeekOrLater(): boolean {
    const today = new Date();
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Istanbul",
      weekday: "short",
    }).format(today);
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
