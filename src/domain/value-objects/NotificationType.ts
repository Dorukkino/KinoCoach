export const NotificationType = {
  NEW_MESSAGE: "NEW_MESSAGE",
  NEW_MOTIVATION: "NEW_MOTIVATION",
  NEW_INVITATION: "NEW_INVITATION",
  INVITATION_ACCEPTED: "INVITATION_ACCEPTED",
  WEEKLY_REMINDER: "WEEKLY_REMINDER",
  WEEKLY_PROGRAM_UPDATED: "WEEKLY_PROGRAM_UPDATED",
  NEW_EXAM_RESULT: "NEW_EXAM_RESULT",
  LESSON_NET_UPDATED: "LESSON_NET_UPDATED",
  WEEKLY_TASK_TOGGLED: "WEEKLY_TASK_TOGGLED",
  QUESTION_SESSION_CREATED: "QUESTION_SESSION_CREATED",
  QUESTION_SESSION_DELETED: "QUESTION_SESSION_DELETED",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

/** Zil UI'da gösterilmeyen tipler (chat ayrı kanalda yönetilecek) */
export const IN_APP_EXCLUDED_NOTIFICATION_TYPES = new Set<NotificationTypeValue>([
  NotificationType.NEW_MESSAGE,
]);

export function isNotificationType(value: string): value is NotificationTypeValue {
  return Object.values(NotificationType).includes(value as NotificationTypeValue);
}
