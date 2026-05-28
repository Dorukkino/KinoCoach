import { Notification } from "@/domain/entities/Notification";
import { NotificationTypeValue } from "@/domain/value-objects/NotificationType";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationTypeValue;
  metadata?: Record<string, string>;
}

export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  countUnreadInApp(userId: string): Promise<number>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  existsByTypeAndMetadata(
    userId: string,
    type: NotificationTypeValue,
    metadataKey: string,
    metadataValue: string
  ): Promise<boolean>;
}
