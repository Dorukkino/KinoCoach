"use server";

import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import type { ServerContainer } from "@/infrastructure/di/container";

async function getAllowedChatSenderIds(
  container: ServerContainer,
  session: Awaited<ReturnType<typeof requireSession>>["session"]
) {
  if (session.role.isCoach()) {
    const { rows } = await container.loadActiveCoachStudents.execute(session.userId);
    return rows
      .map((student) => student.userId)
      .filter((userId): userId is string => Boolean(userId));
  }

  const student = await container.students.findByUserId(session.userId);
  if (!student) return [];

  const activeEngagement = await container.engagements.findActiveByStudent(student.id);
  return activeEngagement ? [activeEngagement.coachId] : [];
}

export async function listMessagesAction(otherUserId: string) {
  const { container, session } = await requireSession();
  return container.listMessages.execute(session.userId, otherUserId);
}

export async function sendMessageAction(receiverId: string, content: string) {
  const { container, session } = await requireSession();
  return container.sendMessage.execute({
    senderId: session.userId,
    receiverId,
    content,
  });
}

export async function countUnreadChatMessagesAction(): Promise<number> {
  const { container, session } = await requireSession();
  const senderIds = await getAllowedChatSenderIds(container, session);
  if (senderIds.length === 0) return 0;

  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", session.userId)
    .in("sender_id", senderIds)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

export async function countUnreadChatMessagesBySenderAction(): Promise<
  Record<string, number>
> {
  const { container, session } = await requireSession();
  const senderIds = await getAllowedChatSenderIds(container, session);
  if (senderIds.length === 0) return {};

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", session.userId)
    .in("sender_id", senderIds)
    .is("read_at", null);

  if (error || !data) return {};

  return data.reduce<Record<string, number>>((acc, row) => {
    const senderId = String(row.sender_id);
    acc[senderId] = (acc[senderId] ?? 0) + 1;
    return acc;
  }, {});
}

export async function markThreadMessagesReadAction(otherUserId: string) {
  const { container, session } = await requireSession();
  const senderIds = await getAllowedChatSenderIds(container, session);
  if (!senderIds.includes(otherUserId)) return;

  const admin = createSupabaseAdminClient();
  await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", session.userId)
    .eq("sender_id", otherUserId)
    .is("read_at", null);
}

/**
 * Belirli bir kullanıcının (genelde koç) verilen `otherUserIds` listesindeki
 * her kişiyle son mesajlaşma zamanını döner. Dönüş `{ [otherUserId]: ISO }`.
 * Hiç mesaj yoksa o kullanıcı dönüş objesinde yer almaz.
 */
export async function getLastMessageTimestampsAction(
  otherUserIds: string[]
): Promise<Record<string, string>> {
  if (otherUserIds.length === 0) return {};
  const { session } = await requireSession();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("sender_id, receiver_id, created_at")
    .or(
      `and(sender_id.eq.${session.userId},receiver_id.in.(${otherUserIds.join(",")})),and(receiver_id.eq.${session.userId},sender_id.in.(${otherUserIds.join(",")}))`
    )
    .order("created_at", { ascending: false });
  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    const other =
      String(row.sender_id) === session.userId
        ? String(row.receiver_id)
        : String(row.sender_id);
    if (!map[other]) map[other] = String(row.created_at);
  }
  return map;
}
