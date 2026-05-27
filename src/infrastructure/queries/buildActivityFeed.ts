import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

/** Aktivite akışında gösterilecek en uzun yaşam süresi (gün) */
const ACTIVITY_MAX_AGE_DAYS = 2;

export interface ActivityItem {
  id: string;
  studentId: string;
  studentName: string;
  type: "exam" | "question_session";
  description: string;
  meta: string;
  note: string;
  timeAgo: string;
  createdAt: string;
}

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

export async function buildActivityFeed(
  studentMap: Map<string, string>,
  studentIds: string[],
  limit = 20
): Promise<ActivityItem[]> {
  if (studentIds.length === 0) return [];

  const admin = createSupabaseAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ACTIVITY_MAX_AGE_DAYS);
  const cutoffISO = cutoff.toISOString();

  const [{ data: exams }, { data: sessions }] = await Promise.all([
    admin
      .from("exam_results")
      .select("id, student_id, scores_json, exam_date, created_at")
      .in("student_id", studentIds)
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("question_sessions")
      .select("id, student_id, lesson_name, correct, total, note, date, created_at")
      .in("student_id", studentIds)
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [];

  for (const exam of exams ?? []) {
    const scores = (exam.scores_json ?? {}) as Record<string, number>;
    const totalNet =
      (scores.turkish ?? 0) +
      (scores.math ?? 0) +
      (scores.science ?? 0) +
      (scores.social ?? 0) +
      (scores.english ?? 0);
    items.push({
      id: `exam-${exam.id}`,
      studentId: String(exam.student_id),
      studentName: studentMap.get(String(exam.student_id)) ?? "Öğrenci",
      type: "exam",
      description: "deneme neti ekledi",
      meta: `Toplam: ${totalNet.toFixed(1)} net`,
      note: "",
      timeAgo: formatTimeAgo(String(exam.created_at)),
      createdAt: String(exam.created_at),
    });
  }

  for (const qs of sessions ?? []) {
    items.push({
      id: `qs-${qs.id}`,
      studentId: String(qs.student_id),
      studentName: studentMap.get(String(qs.student_id)) ?? "Öğrenci",
      type: "question_session",
      description: `${qs.lesson_name} soru çözdü`,
      meta: `${qs.correct}/${qs.total} doğru`,
      note: String(qs.note ?? ""),
      timeAgo: formatTimeAgo(String(qs.created_at)),
      createdAt: String(qs.created_at),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items.slice(0, limit);
}
