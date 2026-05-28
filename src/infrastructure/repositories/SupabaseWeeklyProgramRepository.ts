import { SupabaseClient } from "@supabase/supabase-js";
import {
  IWeeklyProgramRepository,
  WeeklyProgramSummary,
} from "@/application/ports/IWeeklyProgramRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { mapWeeklyProgramRow } from "../supabase/mappers";
import { toLocalDateISO } from "@/lib/dates";

const WEEKLY_PROGRAM_COLUMNS =
  "id, student_id, week_start, grid_json, completion_rate, total_tasks_count, completed_tasks_count, version, updated_at";

const WEEKLY_PROGRAM_SUMMARY_COLUMNS =
  "id, student_id, week_start, completion_rate, total_tasks_count, completed_tasks_count, version, updated_at";

export class SupabaseWeeklyProgramRepository implements IWeeklyProgramRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private weekKey(d: Date) {
    return toLocalDateISO(d);
  }

  async findByEngagementAndWeek(engagementId: string, weekStart: Date) {
    const { data, error } = await this.supabase
      .from("weekly_programs")
      .select(WEEKLY_PROGRAM_COLUMNS)
      .eq("engagement_id", engagementId)
      .eq("week_start", this.weekKey(weekStart))
      .maybeSingle();
    if (error || !data) return null;
    return mapWeeklyProgramRow(data);
  }

  async findSummaryByEngagementAndWeek(
    engagementId: string,
    weekStart: Date
  ): Promise<WeeklyProgramSummary | null> {
    const { data, error } = await this.supabase
      .from("weekly_programs")
      .select(WEEKLY_PROGRAM_SUMMARY_COLUMNS)
      .eq("engagement_id", engagementId)
      .eq("week_start", this.weekKey(weekStart))
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: String(data.id),
      studentId: String(data.student_id),
      weekStart: new Date(String(data.week_start)),
      completionRate: Number(data.completion_rate ?? 0),
      totalTasksCount: Number(data.total_tasks_count ?? 0),
      completedTasksCount: Number(data.completed_tasks_count ?? 0),
      version: Number(data.version ?? 1),
      updatedAt: data.updated_at ? String(data.updated_at) : null,
    };
  }

  async findLatestByEngagement(engagementId: string) {
    const { data, error } = await this.supabase
      .from("weekly_programs")
      .select(WEEKLY_PROGRAM_COLUMNS)
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
      .select(WEEKLY_PROGRAM_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapWeeklyProgramRow(data);
  }

  async toggleCellAtomic(
    engagementId: string,
    weekStart: Date,
    row: number,
    col: number,
    expectedVersion?: number
  ) {
    const { data, error } = await this.supabase.rpc("toggle_weekly_program_cell", {
      p_engagement_id: engagementId,
      p_week_start: this.weekKey(weekStart),
      p_row: row,
      p_col: col,
      p_expected_version: expectedVersion ?? null,
    });
    if (error || !data) return null;
    const rowData = Array.isArray(data) ? data[0] : data;
    if (!rowData) return null;
    return mapWeeklyProgramRow(rowData as Record<string, unknown>);
  }
}
