import { INotificationRepository } from "../ports/INotificationRepository";
import { NotificationDto } from "../dto";
import { IN_APP_EXCLUDED_NOTIFICATION_TYPES } from "@/domain/value-objects/NotificationType";

export class ListNotificationsForUserUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string, limit = 50): Promise<NotificationDto[]> {
    const list = await this.notifications.findByUserId(userId, limit);
    return list
      .filter((n) => !IN_APP_EXCLUDED_NOTIFICATION_TYPES.has(n.type))
      .map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
      }));
  }

  async countUnread(userId: string): Promise<number> {
    const list = await this.notifications.findByUserId(userId, 200);
    return list.filter(
      (n) => !n.isRead && !IN_APP_EXCLUDED_NOTIFICATION_TYPES.has(n.type)
    ).length;
  }
}
