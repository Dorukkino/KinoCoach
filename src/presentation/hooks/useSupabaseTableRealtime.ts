"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";

interface UseSupabaseTableRealtimeOptions {
  channelName: string;
  table: string;
  filter?: string;
  enabled?: boolean;
  onChange: () => void;
}

export function useSupabaseTableRealtime({
  channelName,
  table,
  filter,
  enabled = true,
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

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, enabled, filter, onChange, table]);
}
