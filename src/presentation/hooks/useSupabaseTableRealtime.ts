"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";

interface UseSupabaseTableRealtimeOptions {
  channelName: string;
  table: string;
  filter?: string;
  enabled?: boolean;
  /** @deprecated Polling kaldırıldı — sadece realtime event'ler kullanılır */
  pollIntervalMs?: number;
  onChange: () => void;
}

/**
 * Supabase Realtime subscription hook.
 * Rapid-fire event'leri 1 saniye debounce ile birleştirir.
 */
export function useSupabaseTableRealtime({
  channelName,
  table,
  filter,
  enabled = true,
  onChange,
}: UseSupabaseTableRealtimeOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabaseBrowserClient();

    const debouncedOnChange = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (document.visibilityState === "visible") {
          onChangeRef.current();
        }
      }, 1000);
    };

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
        debouncedOnChange
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [channelName, enabled, filter, table]);
}
