"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";

type RealtimePayload = {
  eventType?: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
};

interface UseSupabaseTableRealtimeOptions {
  channelName: string;
  table: string;
  filter?: string;
  enabled?: boolean;
  /** Rapid-fire event'leri birleştirme süresi (ms). Varsayılan: 1000 */
  debounceMs?: number;
  /** @deprecated Polling kaldırıldı — sadece realtime event'ler kullanılır */
  pollIntervalMs?: number;
  reloadOnVisible?: boolean;
  onChange: (payload?: RealtimePayload) => void;
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
  debounceMs = 1000,
  reloadOnVisible = true,
  onChange,
}: UseSupabaseTableRealtimeOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabaseBrowserClient();

    const runWhenVisible = (payload?: RealtimePayload) => {
      if (document.visibilityState === "visible") {
        onChangeRef.current(payload);
      }
    };

    const debouncedOnChange = (payload: RealtimePayload) => {
      if (debounceMs <= 0) {
        runWhenVisible(payload);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runWhenVisible(payload), debounceMs);
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

    const handleVisibilityChange = () => {
      if (reloadOnVisible && document.visibilityState === "visible") {
        onChangeRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [channelName, debounceMs, enabled, filter, reloadOnVisible, table]);
}
