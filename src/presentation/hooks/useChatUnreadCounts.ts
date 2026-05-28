"use client";

import { useCallback, useEffect, useState } from "react";
import {
  countUnreadChatMessagesAction,
  countUnreadChatMessagesBySenderAction,
} from "@/app/actions/messages";
import { useSupabaseTableRealtime } from "./useSupabaseTableRealtime";

export function useChatUnreadCount(userId: string) {
  const [unreadCount, setUnreadCount] = useState(0);

  const reload = useCallback(async () => {
    const count = await countUnreadChatMessagesAction();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useSupabaseTableRealtime({
    channelName: `chat-unread-${userId}`,
    table: "messages",
    filter: `receiver_id=eq.${userId}`,
    debounceMs: 0,
    onChange: reload,
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

  useSupabaseTableRealtime({
    channelName: `chat-unread-by-sender-${userId}`,
    table: "messages",
    filter: `receiver_id=eq.${userId}`,
    debounceMs: 0,
    onChange: reload,
  });

  return { unreadCounts, reload };
}
