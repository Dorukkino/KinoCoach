"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";

interface UseSupabaseTableRealtimeOptions {
  channelName: string;
  table: string;
  filter?: string;
  enabled?: boolean;
  /** Rapid-fire event'leri birleştirme süresi (ms). Varsayılan: 1000 */
  debounceMs?: number;
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
  debounceMs = 1000,
  onChange,
}: UseSupabaseTableRealtimeOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createSupabaseBrowserClient();

    const debouncedOnChange = () => {
      if (debounceMs <= 0) {
        if (document.visibilityState === "visible") {
          onChangeRef.current();
        }
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (document.visibilityState === "visible") {
          onChangeRef.current();
        }
      }, debounceMs);
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
  }, [channelName, debounceMs, enabled, filter, table]);
}
