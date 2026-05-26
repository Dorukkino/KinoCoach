import { SupabaseClient } from "@supabase/supabase-js";
import {
  IRealtimeChannel,
  MessageHandler,
} from "@/application/ports/IRealtimeChannel";

export class SupabaseRealtimeChatAdapter implements IRealtimeChannel {
  constructor(private readonly supabase: SupabaseClient) {}

  subscribeToMessages(
    _coachId: string,
    _studentUserId: string,
    onMessage: MessageHandler
  ): () => void {
    const channel = this.supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => onMessage(payload.new as Record<string, unknown>)
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}
