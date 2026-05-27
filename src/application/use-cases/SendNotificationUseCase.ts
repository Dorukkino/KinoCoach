import { INotificationRepository } from "../ports/INotificationRepository";
import { IUserRepository } from "../ports/IUserRepository";
import { IEmailService } from "../ports/IEmailService";
import { NotificationDto } from "../dto";
import {
  NotificationType,
  NotificationTypeValue,
} from "@/domain/value-objects/NotificationType";

export interface SendNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationTypeValue;
  metadata?: Record<string, string>;
}

const EMAIL_ENABLED_TYPES = new Set<NotificationTypeValue>([
  NotificationType.NEW_MESSAGE,
  NotificationType.NEW_MOTIVATION,
  NotificationType.NEW_INVITATION,
  NotificationType.INVITATION_ACCEPTED,
  NotificationType.WEEKLY_REMINDER,
]);

export class SendNotificationUseCase {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly users: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(input: SendNotificationInput): Promise<NotificationDto> {
    const notification = await this.notifications.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      metadata: input.metadata,
    });

    if (EMAIL_ENABLED_TYPES.has(input.type)) {
      void this.sendEmailSafely(input.userId, input.title, input.message);
    }

    return this.toDto(notification);
  }

  private async sendEmailSafely(
    userId: string,
    subject: string,
    body: string
  ): Promise<void> {
    try {
      const user = await this.users.findById(userId);
      if (!user?.email) return;
      await this.emailService.send({
        to: user.email,
        subject,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;"><p>${escapeHtml(body)}</p></div>`,
        text: body,
      });
    } catch {
      // E-posta hatası in-app bildirimi geri almaz
    }
  }

  private toDto(notification: {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationTypeValue;
    isRead: boolean;
    metadata: Record<string, string> | null;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
