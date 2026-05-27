import { SupabaseClient } from "@supabase/supabase-js";
import { ILessonNetRepository } from "@/application/ports/ILessonNetRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { mapLessonNetRow } from "../supabase/mappers";
import { toLocalDateISO } from "@/lib/dates";

const LESSON_NET_COLUMNS = "id, student_id, week_start, grid_json";

export class SupabaseLessonNetRepository implements ILessonNetRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private weekKey(d: Date) {
    return toLocalDateISO(d);
  }

  async findByEngagementAndWeek(engagementId: string, weekStart: Date) {
    const { data, error } = await this.supabase
      .from("lesson_nets")
      .select(LESSON_NET_COLUMNS)
      .eq("engagement_id", engagementId)
      .eq("week_start", this.weekKey(weekStart))
      .maybeSingle();
    if (error || !data) return null;
    return mapLessonNetRow(data);
  }

  async upsert(
    engagementId: string,
    studentId: string,
    weekStart: Date,
    grid: Grid7x10
  ) {
    const { data, error } = await this.supabase
      .from("lesson_nets")
      .upsert(
        {
          engagement_id: engagementId,
          student_id: studentId,
          week_start: this.weekKey(weekStart),
          grid_json: grid.toJSON(),
        },
        { onConflict: "engagement_id,week_start" }
      )
      .select(LESSON_NET_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapLessonNetRow(data);
  }
}
