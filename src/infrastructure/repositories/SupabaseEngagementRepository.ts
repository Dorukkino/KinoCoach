import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateEngagementInput,
  IEngagementRepository,
} from "@/application/ports/IEngagementRepository";
import { mapEngagementRow } from "../supabase/mappers";

const ENGAGEMENT_COLUMNS =
  "id, student_id, coach_id, status, started_at, ended_at, end_reason, school_level, grade_at_start, track";

export class SupabaseEngagementRepository implements IEngagementRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapEngagementRow(data);
  }

  async findActiveByStudent(studentId: string) {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (error || !data) return null;
    return mapEngagementRow(data);
  }

  async findActiveByCoach(coachId: string) {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .eq("coach_id", coachId)
      .eq("status", "active")
      .order("started_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapEngagementRow);
  }

  async findAllActive() {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .eq("status", "active")
      .order("started_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapEngagementRow);
  }

  async findHistoricalByCoach(coachId: string) {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .eq("coach_id", coachId)
      .neq("status", "active")
      .order("ended_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapEngagementRow);
  }

  async findAllByStudent(studentId: string) {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .eq("student_id", studentId)
      .order("started_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapEngagementRow);
  }

  async findActiveByCoachAndStudent(coachId: string, studentId: string) {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .select(ENGAGEMENT_COLUMNS)
      .eq("coach_id", coachId)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    if (error || !data) return null;
    return mapEngagementRow(data);
  }

  async create(input: CreateEngagementInput) {
    const { data, error } = await this.supabase
      .from("coaching_engagements")
      .insert({
        student_id: input.studentId,
        coach_id: input.coachId,
        status: "active",
        school_level: input.schoolLevel ?? null,
        grade_at_start: input.gradeAtStart ?? null,
        track: input.track ?? null,
      })
      .select(ENGAGEMENT_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapEngagementRow(data);
  }

  async end(id: string, reason?: string) {
    const { error } = await this.supabase
      .from("coaching_engagements")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        end_reason: reason ?? null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
