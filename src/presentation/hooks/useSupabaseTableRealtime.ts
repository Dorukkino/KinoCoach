"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";
import { useRealtimeEventBus } from "@/presentation/providers/RealtimeEventBusProvider";

function matchesRealtimeFilter(
  filter: string,
  row: Record<string, unknown>
): boolean {
  const eqMatch = /^(\w+)=eq\.(.+)$/.exec(filter);
  if (!eqMatch) return true;
  return String(row[eqMatch[1]] ?? "") === eqMatch[2];
}

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
  debounceMs?: number;
  pollIntervalMs?: number;
  reloadOnVisible?: boolean;
  onChange: (payload?: RealtimePayload) => void;
}

export function useSupabaseTableRealtime({
  channelName,
  table,
  filter,
  enabled = true,
  debounceMs = 1000,
  pollIntervalMs,
  reloadOnVisible = true,
  onChange,
}: UseSupabaseTableRealtimeOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const eventBus = useRealtimeEventBus();

  useEffect(() => {
    if (!enabled) return;

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
      debounceRef.current = setTimeout(
        () => runWhenVisible(payload),
        debounceMs
      );
    };

    if (eventBus) {
      const unsubscribe = eventBus.subscribe({
        table,
        onChange: (payload) => {
          const row = payload?.new ?? payload?.old;
          if (filter && row && !matchesRealtimeFilter(filter, row)) return;
          debouncedOnChange(payload ?? {});
        },
      });
      return () => {
        unsubscribe();
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

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
        debouncedOnChange
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (reloadOnVisible && document.visibilityState === "visible") {
        onChangeRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const pollInterval =
      pollIntervalMs && pollIntervalMs > 0
        ? window.setInterval(() => {
            if (document.visibilityState === "visible") {
              onChangeRef.current();
            }
          }, pollIntervalMs)
        : null;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (pollInterval) window.clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [
    channelName,
    debounceMs,
    enabled,
    eventBus,
    filter,
    pollIntervalMs,
    reloadOnVisible,
    table,
  ]);
}
