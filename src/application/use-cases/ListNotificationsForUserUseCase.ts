import { INotificationRepository } from "../ports/INotificationRepository";
import { NotificationDto } from "../dto";

export class ListNotificationsForUserUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(userId: string, limit = 50): Promise<NotificationDto[]> {
    const list = await this.notifications.findByUserId(userId, limit);
    return list.map((n) => ({
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
    return this.notifications.countUnread(userId);
  }
}
