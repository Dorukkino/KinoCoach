import { SupabaseClient } from "@supabase/supabase-js";
import { IMessageRepository } from "@/application/ports/IMessageRepository";
import { mapMessageRow } from "../supabase/mappers";

export class SupabaseMessageRepository implements IMessageRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findThread(userA: string, userB: string) {
    const { data, error } = await this.supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`
      )
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map(mapMessageRow);
  }

  async create(
    senderId: string,
    receiverId: string,
    content: string,
    attachmentUrl?: string | null
  ) {
    const { data, error } = await this.supabase
      .from("messages")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        attachment_url: attachmentUrl ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapMessageRow(data);
  }
}
