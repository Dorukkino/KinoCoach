"use server";

import { requireSession } from "./lib";
import { revalidatePath } from "next/cache";

export async function listNotificationsAction(limit = 50) {
  const { container, session } = await requireSession();
  return container.listNotifications.execute(session.userId, limit);
}

export async function countUnreadNotificationsAction() {
  const { container, session } = await requireSession();
  return container.listNotifications.countUnread(session.userId);
}

export async function markNotificationReadAction(id: string) {
  const { container, session } = await requireSession();
  await container.markNotificationRead.execute(id, session.userId);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const { container, session } = await requireSession();
  await container.markNotificationRead.markAll(session.userId);
  revalidatePath("/", "layout");
}

export async function deleteNotificationAction(id: string) {
  const { container, session } = await requireSession();
  await container.deleteNotification.execute(id, session.userId);
  revalidatePath("/", "layout");
}

export async function deleteAllNotificationsAction() {
  const { container, session } = await requireSession();
  await container.deleteNotification.deleteAll(session.userId);
  revalidatePath("/", "layout");
}
