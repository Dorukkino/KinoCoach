export const NotificationType = {
  NEW_MESSAGE: "NEW_MESSAGE",
  NEW_MOTIVATION: "NEW_MOTIVATION",
  NEW_INVITATION: "NEW_INVITATION",
  INVITATION_ACCEPTED: "INVITATION_ACCEPTED",
  WEEKLY_REMINDER: "WEEKLY_REMINDER",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export function isNotificationType(value: string): value is NotificationTypeValue {
  return Object.values(NotificationType).includes(value as NotificationTypeValue);
}
