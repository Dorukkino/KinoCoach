import { SupabaseClient } from "@supabase/supabase-js";
import { IMotivationRepository } from "@/application/ports/IMotivationRepository";
import { mapMotivationRow } from "../supabase/mappers";

const MOTIVATION_COLUMNS =
  "id, coach_id, student_id, message, created_at";

export class SupabaseMotivationRepository implements IMotivationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(
    engagementId: string,
    coachId: string,
    studentId: string,
    message: string
  ) {
    const { data, error } = await this.supabase
      .from("motivation_messages")
      .insert({
        engagement_id: engagementId,
        coach_id: coachId,
        student_id: studentId,
        message,
      })
      .select(MOTIVATION_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapMotivationRow(data);
  }

  async findByEngagement(engagementId: string) {
    const { data, error } = await this.supabase
      .from("motivation_messages")
      .select(MOTIVATION_COLUMNS)
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapMotivationRow);
  }

  async findLatestByEngagement(engagementId: string) {
    const { data, error } = await this.supabase
      .from("motivation_messages")
      .select(MOTIVATION_COLUMNS)
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapMotivationRow(data);
  }
}
