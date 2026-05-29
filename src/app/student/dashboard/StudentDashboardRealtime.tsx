"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function StudentDashboardRealtime({ studentId }: { studentId: string }) {
  const router = useRouter();
  const refreshDashboard = useCallback(() => {
    router.refresh();
  }, [router]);

  useSupabaseTableRealtime({
    channelName: `student-dashboard-engagements-${studentId}`,
    table: "coaching_engagements",
    filter: `student_id=eq.${studentId}`,
    onChange: refreshDashboard,
  });

  return null;
}
