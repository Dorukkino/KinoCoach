import { SupabaseClient } from "@supabase/supabase-js";
import { IWeeklyProgramRepository } from "@/application/ports/IWeeklyProgramRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { mapWeeklyProgramRow } from "../supabase/mappers";
import { toLocalDateISO } from "@/lib/dates";

export class SupabaseWeeklyProgramRepository implements IWeeklyProgramRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private weekKey(d: Date) {
    return toLocalDateISO(d);
  }

  async findByEngagementAndWeek(engagementId: string, weekStart: Date) {
    const { data, error } = await this.supabase
      .from("weekly_programs")
      .select("*")
      .eq("engagement_id", engagementId)
      .eq("week_start", this.weekKey(weekStart))
      .maybeSingle();
    if (error || !data) return null;
    return mapWeeklyProgramRow(data);
  }

  async findLatestByEngagement(engagementId: string) {
    const { data, error } = await this.supabase
      .from("weekly_programs")
      .select("*")
      .eq("engagement_id", engagementId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapWeeklyProgramRow(data);
  }

  async listWeekStartsByEngagement(engagementId: string): Promise<Date[]> {
    const { data, error } = await this.supabase
      .from("weekly_programs")
      .select("week_start")
      .eq("engagement_id", engagementId)
      .order("week_start", { ascending: false });
    if (error || !data) return [];
    return data
      .map((row) => (row.week_start ? new Date(String(row.week_start)) : null))
      .filter((d): d is Date => d !== null);
  }

  async upsert(
    engagementId: string,
    studentId: string,
    weekStart: Date,
    grid: Grid7x10,
    completionRate: number
  ) {
    const { data, error } = await this.supabase
      .from("weekly_programs")
      .upsert(
        {
          engagement_id: engagementId,
          student_id: studentId,
          week_start: this.weekKey(weekStart),
          grid_json: grid.toJSON(),
          completion_rate: completionRate,
        },
        { onConflict: "engagement_id,week_start" }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapWeeklyProgramRow(data);
  }
}
