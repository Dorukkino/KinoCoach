"use server";

import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

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
