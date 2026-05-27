"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function CoachDashboardRealtime() {
  const router = useRouter();
  const refreshDashboard = useCallback(() => {
    router.refresh();
  }, [router]);

  useSupabaseTableRealtime({
    channelName: "coach-dashboard-engagements",
    table: "coaching_engagements",
    onChange: refreshDashboard,
  });

  useSupabaseTableRealtime({
    channelName: "coach-dashboard-students",
    table: "students",
    onChange: refreshDashboard,
  });

  useSupabaseTableRealtime({
    channelName: "coach-dashboard-exams",
    table: "exam_results",
    onChange: refreshDashboard,
  });

  useSupabaseTableRealtime({
    channelName: "coach-dashboard-question-sessions",
    table: "question_sessions",
    onChange: refreshDashboard,
  });

  return null;
}
