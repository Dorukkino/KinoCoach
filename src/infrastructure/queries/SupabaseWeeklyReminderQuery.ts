import { SupabaseClient } from "@supabase/supabase-js";
import { getWeekStartISO } from "@/lib/dates";

const COMPLETION_THRESHOLD = 30;

export interface WeeklyReminderCandidate {
  engagementId: string;
  studentId: string;
  studentUserId: string;
  studentName: string;
  completionPercent: number;
}

export class SupabaseWeeklyReminderQuery {
  constructor(private readonly supabase: SupabaseClient) {}

  async fetchCandidates(
    weekStart: string,
    threshold = COMPLETION_THRESHOLD
  ): Promise<WeeklyReminderCandidate[]> {
    const { data, error } = await this.supabase.rpc("weekly_reminder_candidates", {
      p_week_start: weekStart,
      p_threshold: threshold,
    });
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((row) => ({
      engagementId: String(row.engagement_id),
      studentId: String(row.student_id),
      studentUserId: String(row.student_user_id),
      studentName: String(row.student_name),
      completionPercent: Number(row.completion_percent ?? 0),
    }));
  }

  currentWeekStart(): string {
    return getWeekStartISO();
  }
}
