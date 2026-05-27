import { INotificationRepository } from "../ports/INotificationRepository";

export class DeleteNotificationUseCase {
  constructor(private readonly notifications: INotificationRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    await this.notifications.delete(id, userId);
  }

  async deleteAll(userId: string): Promise<void> {
    await this.notifications.deleteAll(userId);
  }
}
