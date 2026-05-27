import { NotificationTypeValue } from "../value-objects/NotificationType";

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type: NotificationTypeValue,
    public readonly isRead: boolean,
    public readonly metadata: Record<string, string> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  markAsRead(): Notification {
    return new Notification(
      this.id,
      this.userId,
      this.title,
      this.message,
      this.type,
      true,
      this.metadata,
      this.createdAt,
      new Date()
    );
  }
}
