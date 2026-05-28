"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";

type RealtimePayload = {
  eventType?: string;
  new?: Record<string, unknown>;
  old?: Record<string, unknown>;
};

type Subscription = {
  id: string;
  table: string;
  filter?: string;
  onChange: (payload?: RealtimePayload) => void;
};

interface RealtimeEventBusContextValue {
  subscribe: (subscription: Omit<Subscription, "id">) => () => void;
}

const RealtimeEventBusContext =
  createContext<RealtimeEventBusContextValue | null>(null);

function getEventTimestamp(payload?: RealtimePayload): string | null {
  const row = payload?.new ?? payload?.old;
  if (!row) return null;
  const updated = row.updated_at ?? row.created_at;
  return updated ? String(updated) : null;
}

export function RealtimeEventBusProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const lastSeenRef = useRef<Map<string, string>>(new Map());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createSupabaseBrowserClient>["channel"]
  > | null>(null);

  const subscribe = useCallback((subscription: Omit<Subscription, "id">) => {
    const id = crypto.randomUUID();
    subscriptionsRef.current.set(id, { ...subscription, id });
    return () => {
      subscriptionsRef.current.delete(id);
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`app-realtime-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => dispatch("messages", undefined, payload as RealtimePayload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => dispatch("notifications", undefined, payload as RealtimePayload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "question_sessions" },
        (payload) =>
          dispatch("question_sessions", undefined, payload as RealtimePayload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_results" },
        (payload) => dispatch("exam_results", undefined, payload as RealtimePayload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weekly_programs" },
        (payload) =>
          dispatch("weekly_programs", undefined, payload as RealtimePayload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesson_nets" },
        (payload) => dispatch("lesson_nets", undefined, payload as RealtimePayload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coaching_engagements" },
        (payload) =>
          dispatch("coaching_engagements", undefined, payload as RealtimePayload)
      )
      .subscribe();

    channelRef.current = channel;

    function dispatch(
      table: string,
      filter: string | undefined,
      payload: RealtimePayload
    ) {
      const ts = getEventTimestamp(payload);
      const key = `${table}:${filter ?? "all"}`;
      if (ts) {
        const last = lastSeenRef.current.get(key);
        if (last && new Date(ts).getTime() < new Date(last).getTime()) {
          return;
        }
        lastSeenRef.current.set(key, ts);
      }

      for (const sub of subscriptionsRef.current.values()) {
        if (sub.table !== table) continue;
        if (sub.filter && filter && sub.filter !== filter) continue;
        sub.onChange(payload);
      }
    }

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId]);

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return (
    <RealtimeEventBusContext.Provider value={value}>
      {children}
    </RealtimeEventBusContext.Provider>
  );
}

export function useRealtimeEventBus() {
  return useContext(RealtimeEventBusContext);
}
