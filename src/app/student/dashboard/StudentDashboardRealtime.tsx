"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function StudentDashboardRealtime() {
  const router = useRouter();
  const refreshDashboard = useCallback(() => {
    router.refresh();
  }, [router]);

  useSupabaseTableRealtime({
    channelName: "student-dashboard-engagements",
    table: "coaching_engagements",
    onChange: refreshDashboard,
  });

  return null;
}
