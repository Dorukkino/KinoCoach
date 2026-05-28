"use server";

import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

async function getAllowedChatPeerIds(
  session: Awaited<ReturnType<typeof requireSession>>["session"]
) {
  const admin = createSupabaseAdminClient();

  if (session.role.isCoach()) {
    const { data: engagements, error: engagementError } = await admin
      .from("coaching_engagements")
      .select("student_id")
      .eq("coach_id", session.userId)
      .eq("status", "active");

    if (engagementError || !engagements || engagements.length === 0) return [];

    const studentIds = engagements.map((row) => String(row.student_id));
    const { data: students, error: studentError } = await admin
      .from("students")
      .select("user_id")
      .in("id", studentIds);

    if (studentError || !students) return [];
    return students
      .map((student) => student.user_id)
      .filter((userId): userId is string => Boolean(userId));
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (studentError || !student) return [];

  const { data: engagement, error: engagementError } = await admin
    .from("coaching_engagements")
    .select("coach_id")
    .eq("student_id", student.id)
    .eq("status", "active")
    .maybeSingle();

  if (engagementError || !engagement) return [];
  return [String(engagement.coach_id)];
}

export async function listMessagesAction(otherUserId: string) {
  const { container, session } = await requireSession();
  const peerIds = await getAllowedChatPeerIds(session);
  if (!peerIds.includes(otherUserId)) return [];
  return container.listMessages.execute(session.userId, otherUserId);
}

export async function sendMessageAction(receiverId: string, content: string) {
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
}

export async function countUnreadChatMessagesAction(): Promise<number> {
  const { session } = await requireSession();
  const senderIds = await getAllowedChatPeerIds(session);
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
  const { session } = await requireSession();
  const senderIds = await getAllowedChatPeerIds(session);
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
  const { session } = await requireSession();
  const senderIds = await getAllowedChatPeerIds(session);
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
