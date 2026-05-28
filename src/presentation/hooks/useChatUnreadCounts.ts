"use client";

import { useCallback, useEffect, useState } from "react";
import {
  countUnreadChatMessagesAction,
  countUnreadChatMessagesBySenderAction,
} from "@/app/actions/messages";
import { useSupabaseTableRealtime } from "./useSupabaseTableRealtime";

type MessageRealtimePayload = {
  eventType?: string;
  new?: Record<string, unknown>;
};

export function useChatUnreadCount(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0);

  const reload = useCallback(async () => {
    const count = await countUnreadChatMessagesAction();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRealtimeChange = useCallback(
    (payload?: MessageRealtimePayload) => {
      const row = payload?.new;
      if (
        payload?.eventType === "INSERT" &&
        row &&
        String(row.receiver_id) === userId &&
        row.read_at == null
      ) {
        setUnreadCount((count) => count + 1);
        return;
      }

      void reload();
    },
    [reload, userId]
  );

  useSupabaseTableRealtime({
    channelName: `chat-unread-${userId}`,
    table: "messages",
    filter: `receiver_id=eq.${userId}`,
    debounceMs: 0,
    pollIntervalMs: 2000,
    onChange: handleRealtimeChange,
  });

  return { unreadCount, reload };
}

export function useChatUnreadCountsBySender(userId: string) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    const counts = await countUnreadChatMessagesBySenderAction();
    setUnreadCounts(counts);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRealtimeChange = useCallback(
    (payload?: MessageRealtimePayload) => {
      const row = payload?.new;
      if (
        payload?.eventType === "INSERT" &&
        row &&
        String(row.receiver_id) === userId &&
        row.read_at == null
      ) {
        const senderId = String(row.sender_id);
        setUnreadCounts((counts) => ({
          ...counts,
          [senderId]: (counts[senderId] ?? 0) + 1,
        }));
        return;
      }

      void reload();
    },
    [reload, userId]
  );

  useSupabaseTableRealtime({
    channelName: `chat-unread-by-sender-${userId}`,
    table: "messages",
    filter: `receiver_id=eq.${userId}`,
    debounceMs: 0,
    pollIntervalMs: 2000,
    onChange: handleRealtimeChange,
  });

  return { unreadCounts, reload };
}
