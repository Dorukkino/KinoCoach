import { SupabaseClient } from "@supabase/supabase-js";
import { IMotivationRepository } from "@/application/ports/IMotivationRepository";
import { mapMotivationRow } from "../supabase/mappers";

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
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapMotivationRow(data);
  }

  async findByEngagement(engagementId: string) {
    const { data, error } = await this.supabase
      .from("motivation_messages")
      .select("*")
      .eq("engagement_id", engagementId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapMotivationRow);
  }
}
