import { SupabaseClient } from "@supabase/supabase-js";
import { IStudentLastActivityQuery } from "@/application/ports/IStudentLastActivityQuery";

export class SupabaseStudentLastActivityQuery
  implements IStudentLastActivityQuery
{
  constructor(private readonly supabase: SupabaseClient) {}

  async findLatestByStudentIds(
    studentIds: string[]
  ): Promise<Map<string, Date>> {
    if (studentIds.length === 0) return new Map();

    const latest = new Map<string, Date>();
    const merge = (studentId: string, iso: string | null | undefined) => {
      if (!iso) return;
      const at = new Date(iso);
      if (Number.isNaN(at.getTime())) return;
      const prev = latest.get(studentId);
      if (!prev || at > prev) latest.set(studentId, at);
    };

    // Her tablodan sadece öğrenci başına en son kaydı çek (limit ile)
    const [studentsRes, examsRes, sessionsRes, netsRes] = await Promise.all([
      this.supabase
        .from("students")
        .select("id, last_active_at")
        .in("id", studentIds),
      this.supabase
        .from("exam_results")
        .select("student_id, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(studentIds.length),
      this.supabase
        .from("question_sessions")
        .select("student_id, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(studentIds.length),
      this.supabase
        .from("lesson_nets")
        .select("student_id, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(studentIds.length),
    ]);

    for (const row of studentsRes.data ?? []) {
      merge(String(row.id), row.last_active_at as string | null);
    }
    for (const row of examsRes.data ?? []) {
      merge(String(row.student_id), row.created_at as string);
    }
    for (const row of sessionsRes.data ?? []) {
      merge(String(row.student_id), row.created_at as string);
    }
    for (const row of netsRes.data ?? []) {
      merge(String(row.student_id), row.created_at as string);
    }

    return latest;
  }
}
