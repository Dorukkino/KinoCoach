"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

function TableRefresh({
  channelName,
  table,
  pollIntervalMs,
  onRefresh,
}: {
  channelName: string;
  table: string;
  pollIntervalMs?: number;
  onRefresh: () => void;
}) {
  useSupabaseTableRealtime({
    channelName,
    table,
    pollIntervalMs,
    onChange: onRefresh,
  });

  return null;
}

export function RealtimeRouteRefresh({
  channelPrefix,
  tables,
  pollIntervalMs = 5000,
}: {
  channelPrefix: string;
  tables: string[];
  pollIntervalMs?: number;
}) {
  const router = useRouter();
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {tables.map((table, index) => (
        <TableRefresh
          key={table}
          channelName={`${channelPrefix}-${table}`}
          table={table}
          pollIntervalMs={index === 0 ? pollIntervalMs : undefined}
          onRefresh={refresh}
        />
      ))}
    </>
  );
}
