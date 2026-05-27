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

    const { data, error } = await this.supabase.rpc(
      "student_last_activity_at",
      { p_student_ids: studentIds }
    );

    if (error || !data) return new Map();

    const latest = new Map<string, Date>();
    for (const row of data) {
      const at = new Date(String(row.last_at));
      if (!Number.isNaN(at.getTime())) {
        latest.set(String(row.student_id), at);
      }
    }
    return latest;
  }
}
