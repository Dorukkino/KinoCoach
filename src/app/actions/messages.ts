"use server";

import { Buffer } from "node:buffer";
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

const MAX_CHAT_ATTACHMENT_SIZE = 10 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export async function sendMessageAction(
  receiverId: string,
  content: string,
  formData?: FormData
) {
  return measureAction("sendMessageAction", async () => {
    const { container, session } = await requireSession();
    const peerIds = await getAllowedChatPeerIds(session);
    if (!peerIds.includes(receiverId)) {
      throw new Error("Bu kullanıcıya mesaj gönderme yetkiniz yok.");
    }

    const trimmedContent = content.trim();
    const attachment = formData?.get("attachment");
    const file =
      attachment instanceof File && attachment.size > 0 ? attachment : null;

    if (!trimmedContent && !file) {
      throw new Error("Mesaj boş olamaz.");
    }

    if (file && file.size > MAX_CHAT_ATTACHMENT_SIZE) {
      throw new Error("Dosya boyutu en fazla 10 MB olabilir.");
    }

    const filePayload = file
      ? {
          buffer: Buffer.from(await file.arrayBuffer()),
          contentType: file.type || "application/octet-stream",
          path: `${session.userId}/${Date.now()}-${sanitizeFileName(file.name)}`,
        }
      : undefined;

    return container.sendMessage.execute({
      senderId: session.userId,
      receiverId,
      content: trimmedContent || file?.name || "",
      file: filePayload,
    });
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

export async function deleteThreadMessagesAction(otherUserId: string) {
  return measureAction("deleteThreadMessagesAction", async () => {
    const { session } = await requireSession();
    const peerIds = await getAllowedChatPeerIds(session);
    if (!peerIds.includes(otherUserId)) {
      throw new Error("Bu sohbeti silme yetkiniz yok.");
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${session.userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${session.userId})`
      );

    if (error) {
      throw new Error(error.message);
    }
  });
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
