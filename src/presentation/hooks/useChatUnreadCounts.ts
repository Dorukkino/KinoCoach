"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  countUnreadChatMessagesAction,
  countUnreadChatMessagesBySenderAction,
} from "@/app/actions/messages";
import { useSupabaseTableRealtime } from "./useSupabaseTableRealtime";

type MessageRealtimePayload = {
  eventType?: string;
  new?: Record<string, unknown>;
};

const CHAT_THREAD_READ_EVENT = "kino:chat-thread-read";

function emitChatThreadRead(senderId: string, count: number) {
  window.dispatchEvent(
    new CustomEvent(CHAT_THREAD_READ_EVENT, {
      detail: { senderId, count },
    })
  );
}

export function useChatUnreadCount(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0);

  const reload = useCallback(async () => {
    const count = await countUnreadChatMessagesAction();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const handleThreadRead = (event: Event) => {
      const { count } = (event as CustomEvent<{ count?: number }>).detail ?? {};
      if (typeof count !== "number" || count <= 0) {
        void reload();
        return;
      }
      setUnreadCount((current) => Math.max(0, current - count));
    };

    window.addEventListener(CHAT_THREAD_READ_EVENT, handleThreadRead);
    return () => window.removeEventListener(CHAT_THREAD_READ_EVENT, handleThreadRead);
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
    onChange: handleRealtimeChange,
  });

  return { unreadCount, reload };
}

export function useChatUnreadCountsBySender(userId: string) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const unreadCountsRef = useRef<Record<string, number>>({});

  const reload = useCallback(async () => {
    const counts = await countUnreadChatMessagesBySenderAction();
    setUnreadCounts(counts);
  }, []);

  const clearSender = useCallback((senderId: string) => {
    const clearedCount = unreadCountsRef.current[senderId] ?? 0;
    if (clearedCount <= 0) return;
    setUnreadCounts((counts) => {
      const next = { ...counts };
      delete next[senderId];
      return next;
    });
    emitChatThreadRead(senderId, clearedCount);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    unreadCountsRef.current = unreadCounts;
  }, [unreadCounts]);

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
    onChange: handleRealtimeChange,
  });

  return { unreadCounts, reload, clearSender };
}
