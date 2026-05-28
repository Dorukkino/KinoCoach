"use server";

import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { SupabaseChatQuery } from "@/infrastructure/queries/SupabaseChatQuery";
import { measureAction } from "@/infrastructure/performance/measureAction";
import type { MessageThreadCursor } from "@/application/ports/IMessageRepository";

async function getChatQuery() {
  return new SupabaseChatQuery(createSupabaseAdminClient());
}

async function getAllowedChatPeerIds(
  session: Awaited<ReturnType<typeof requireSession>>["session"]
) {
  return getChatQuery().then((q) => q.allowedPeerIds(session.userId));
}

export async function listMessagesAction(
  otherUserId: string,
  before?: MessageThreadCursor
) {
  return measureAction("listMessagesAction", async () => {
    const { container, session } = await requireSession();
    const peerIds = await getAllowedChatPeerIds(session);
    if (!peerIds.includes(otherUserId)) {
      return { messages: [], hasMore: false, nextCursor: null };
    }
    return container.listMessages.execute(session.userId, otherUserId, {
      before,
    });
  });
}

export async function sendMessageAction(receiverId: string, content: string) {
  return measureAction("sendMessageAction", async () => {
    const { session } = await requireSession();
    const peerIds = await getAllowedChatPeerIds(session);
    if (!peerIds.includes(receiverId)) {
      throw new Error("Bu kullanıcıya mesaj gönderme yetkiniz yok.");
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      throw new Error("Mesaj boş olamaz.");
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("messages")
      .insert({
        sender_id: session.userId,
        receiver_id: receiverId,
        content: trimmedContent,
        attachment_url: null,
      })
      .select("id, sender_id, receiver_id, content, created_at, attachment_url")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Mesaj gönderilemedi.");
    }

    return {
      id: String(data.id),
      senderId: String(data.sender_id),
      receiverId: String(data.receiver_id),
      content: String(data.content ?? ""),
      createdAt: new Date(String(data.created_at)).toISOString(),
      attachmentUrl: data.attachment_url ? String(data.attachment_url) : null,
      isMine: true,
    };
  });
}

export async function countUnreadChatMessagesAction(): Promise<number> {
  return measureAction("countUnreadChatMessagesAction", async () => {
    const { session } = await requireSession();
    const counts = await getChatQuery().then((q) =>
      q.unreadCountsBySender(session.userId)
    );
    return Object.values(counts).reduce((sum, n) => sum + n, 0);
  });
}

export async function countUnreadChatMessagesBySenderAction(): Promise<
  Record<string, number>
> {
  return measureAction("countUnreadChatMessagesBySenderAction", async () => {
    const { session } = await requireSession();
    return getChatQuery().then((q) => q.unreadCountsBySender(session.userId));
  });
}

export async function markThreadMessagesReadAction(otherUserId: string) {
  const { session } = await requireSession();
  const peerIds = await getAllowedChatPeerIds(session);
  if (!peerIds.includes(otherUserId)) return;

  const admin = createSupabaseAdminClient();
  await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", session.userId)
    .eq("sender_id", otherUserId)
    .is("read_at", null);
}

export async function getLastMessageTimestampsAction(
  otherUserIds: string[]
): Promise<Record<string, string>> {
  return measureAction("getLastMessageTimestampsAction", async () => {
    if (otherUserIds.length === 0) return {};
    const { session } = await requireSession();
    return getChatQuery().then((q) =>
      q.lastMessageTimestamps(session.userId, otherUserIds)
    );
  });
}
