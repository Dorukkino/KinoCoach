"use client";

import { useEffect, useRef, useState } from "react";
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
  const [channelConnected, setChannelConnected] = useState(false);
  onChangeRef.current = onChange;
  const eventBus = useRealtimeEventBus();
  const eventBusSubscribe = eventBus?.subscribe;
  const realtimeConnected = eventBus ? eventBus.isConnected : channelConnected;

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

    if (eventBusSubscribe) {
      const unsubscribe = eventBusSubscribe({
        table,
        onChange: (payload) => {
          const row = payload?.new ?? payload?.old;
          if (filter && row && !matchesRealtimeFilter(filter, row)) return;
          debouncedOnChange(payload ?? {});
        },
      });

      const handleVisibilityChange = () => {
        if (reloadOnVisible && document.visibilityState === "visible") {
          onChangeRef.current();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        unsubscribe();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      .subscribe((status) => {
        setChannelConnected(status === "SUBSCRIBED");
      });

    const handleVisibilityChange = () => {
      if (reloadOnVisible && document.visibilityState === "visible") {
        onChangeRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setChannelConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [
    channelName,
    debounceMs,
    enabled,
    eventBusSubscribe,
    filter,
    reloadOnVisible,
    table,
  ]);

  useEffect(() => {
    if (!enabled || !pollIntervalMs || pollIntervalMs <= 0 || realtimeConnected) {
      return;
    }

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        onChangeRef.current();
      }
    }, pollIntervalMs);

    return () => window.clearInterval(pollInterval);
  }, [enabled, pollIntervalMs, realtimeConnected]);
}
