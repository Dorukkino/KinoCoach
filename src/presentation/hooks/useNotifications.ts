"use client";

import { useCallback, useEffect, useState } from "react";
import {
  countUnreadNotificationsAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { NotificationDto } from "@/application/dto";
import { useSupabaseTableRealtime } from "./useSupabaseTableRealtime";

export function useNotifications(userId: string) {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [list, count] = await Promise.all([
      listNotificationsAction(),
      countUnreadNotificationsAction(),
    ]);
    setItems(list);
    setUnreadCount(count);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useSupabaseTableRealtime({
    channelName: `notifications-${userId}`,
    table: "notifications",
    filter: `user_id=eq.${userId}`,
    debounceMs: 500,
    onChange: reload,
  });

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationReadAction(id);
      await reload();
    },
    [reload]
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsReadAction();
    await reload();
  }, [reload]);

  return {
    items,
    unreadCount,
    loading,
    reload,
    markRead,
    markAllRead,
  };
}
