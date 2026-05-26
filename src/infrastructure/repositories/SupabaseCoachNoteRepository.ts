import { SupabaseClient } from "@supabase/supabase-js";
import { ICoachNoteRepository } from "@/application/ports/ICoachNoteRepository";
import { mapCoachNoteRow } from "../supabase/mappers";

export class SupabaseCoachNoteRepository implements ICoachNoteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByEngagement(engagementId: string) {
    const { data, error } = await this.supabase
      .from("coach_notes")
      .select("*")
      .eq("engagement_id", engagementId)
      .maybeSingle();
    if (error || !data) return null;
    return mapCoachNoteRow(data);
  }

  async findByEngagementIds(engagementIds: string[]) {
    if (engagementIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("coach_notes")
      .select("*")
      .in("engagement_id", engagementIds);
    if (error || !data) return [];
    return data.map(mapCoachNoteRow);
  }

  async upsert(
    engagementId: string,
    coachId: string,
    studentId: string,
    note: string
  ) {
    const { data, error } = await this.supabase
      .from("coach_notes")
      .upsert(
        {
          engagement_id: engagementId,
          coach_id: coachId,
          student_id: studentId,
          note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "engagement_id" }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCoachNoteRow(data);
  }
}
