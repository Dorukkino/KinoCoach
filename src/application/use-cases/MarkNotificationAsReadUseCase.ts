import { INotificationRepository } from "../ports/INotificationRepository";

export class MarkNotificationAsReadUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    await this.notifications.markAsRead(id, userId);
  }

  async markAll(userId: string): Promise<void> {
    await this.notifications.markAllAsRead(userId);
  }
}
