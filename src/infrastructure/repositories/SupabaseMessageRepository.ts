import { SupabaseClient } from "@supabase/supabase-js";
import {
  IMessageRepository,
  MessageThreadCursor,
  MessageThreadPage,
} from "@/application/ports/IMessageRepository";
import { mapMessageRow } from "../supabase/mappers";

const MESSAGE_COLUMNS =
  "id, sender_id, receiver_id, content, created_at, attachment_url";

const DEFAULT_PAGE_SIZE = 50;

export class SupabaseMessageRepository implements IMessageRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private cursorFilter(before?: MessageThreadCursor) {
    if (!before) return "";
    return `,or(created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id}))`;
  }

  private threadOrFilter(
    userA: string,
    userB: string,
    before?: MessageThreadCursor
  ) {
    const cursor = this.cursorFilter(before);
    return `and(sender_id.eq.${userA},receiver_id.eq.${userB}${cursor}),and(sender_id.eq.${userB},receiver_id.eq.${userA}${cursor})`;
  }

  async findThread(userA: string, userB: string) {
    const page = await this.findThreadPage(userA, userB, {
      limit: DEFAULT_PAGE_SIZE,
    });
    return page.messages;
  }

  async findThreadPage(
    userA: string,
    userB: string,
    options?: { limit?: number; before?: MessageThreadCursor }
  ): Promise<MessageThreadPage> {
    const limit = options?.limit ?? DEFAULT_PAGE_SIZE;
    const query = this.supabase
      .from("messages")
      .select(MESSAGE_COLUMNS)
      .or(this.threadOrFilter(userA, userB, options?.before))
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    const { data, error } = await query;
    if (error || !data) {
      return { messages: [], hasMore: false, nextCursor: null };
    }

    const hasMore = data.length > limit;
    const slice = hasMore ? data.slice(0, limit) : data;
    const ordered = [...slice].reverse().map(mapMessageRow);
    const oldest = slice[slice.length - 1];

    return {
      messages: ordered,
      hasMore,
      nextCursor: hasMore && oldest
        ? {
            createdAt: String(oldest.created_at),
            id: String(oldest.id),
          }
        : null,
    };
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
      .select(MESSAGE_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapMessageRow(data);
  }
}
