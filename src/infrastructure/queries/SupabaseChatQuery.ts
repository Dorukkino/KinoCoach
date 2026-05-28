import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseChatQuery {
  constructor(private readonly supabase: SupabaseClient) {}

  async allowedPeerIds(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.rpc("chat_allowed_peers", {
      p_user_id: userId,
    });
    if (error || !data) return [];
    return (data as { peer_user_id: string }[]).map((row) =>
      String(row.peer_user_id)
    );
  }

  async unreadCountsBySender(
    userId: string
  ): Promise<Record<string, number>> {
    const { data, error } = await this.supabase.rpc(
      "chat_unread_counts_by_sender",
      { p_user_id: userId }
    );
    if (error || !data) return {};
    return (data as { sender_id: string; unread_count: number }[]).reduce<
      Record<string, number>
    >((acc, row) => {
      acc[String(row.sender_id)] = Number(row.unread_count);
      return acc;
    }, {});
  }

  async lastMessageTimestamps(
    userId: string,
    peerIds: string[]
  ): Promise<Record<string, string>> {
    if (peerIds.length === 0) return {};
    const { data, error } = await this.supabase.rpc(
      "last_message_timestamps",
      { p_user_id: userId, p_peer_ids: peerIds }
    );
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const row of data as { peer_id: string; last_at: string }[]) {
      map[String(row.peer_id)] = String(row.last_at);
    }
    return map;
  }
}
