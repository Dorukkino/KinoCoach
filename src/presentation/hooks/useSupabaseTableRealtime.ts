"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";

interface UseSupabaseTableRealtimeOptions {
  channelName: string;
  table: string;
  filter?: string;
  enabled?: boolean;
  pollIntervalMs?: number;
  onChange: () => void;
}

export function useSupabaseTableRealtime({
  channelName,
  table,
  filter,
  enabled = true,
  pollIntervalMs,
  onChange,
}: UseSupabaseTableRealtimeOptions) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        onChange
      )
      .subscribe();
    const interval =
      pollIntervalMs && pollIntervalMs > 0
        ? window.setInterval(() => {
            if (document.visibilityState === "visible") onChange();
          }, pollIntervalMs)
        : null;

    return () => {
      if (interval) window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [channelName, enabled, filter, onChange, pollIntervalMs, table]);
}
