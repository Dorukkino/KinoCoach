import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import type { ActivityItem } from "./buildActivityFeed";

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "az önce";
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

export async function fetchCoachActivityFeedViaRpc(
  coachId: string,
  studentMap: Map<string, string>,
  limit = 20
): Promise<ActivityItem[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("coach_activity_feed", {
    p_coach_id: coachId,
    p_limit: limit,
  });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const studentId = String(row.student_id);
    const type = String(row.activity_type) as ActivityItem["type"];
    return {
      id: String(row.id),
      studentId,
      studentName: studentMap.get(studentId) ?? "Öğrenci",
      type,
      description: String(row.description ?? ""),
      meta: String(row.meta ?? ""),
      note: String(row.note ?? ""),
      timeAgo: formatTimeAgo(String(row.created_at)),
      createdAt: String(row.created_at),
    };
  });
}
