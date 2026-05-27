import { SupabaseClient } from "@supabase/supabase-js";
import { ICoachNoteRepository } from "@/application/ports/ICoachNoteRepository";
import { mapCoachNoteRow } from "../supabase/mappers";

export class SupabaseCoachNoteRepository implements ICoachNoteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("coach_notes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapCoachNoteRow(data);
  }

  async findByEngagement(engagementId: string) {
    const { data, error } = await this.supabase
      .from("coach_notes")
      .select("*")
      .eq("engagement_id", engagementId)
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapCoachNoteRow);
  }

  async findByEngagementIds(engagementIds: string[]) {
    if (engagementIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from("coach_notes")
      .select("*")
      .in("engagement_id", engagementIds)
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapCoachNoteRow);
  }

  async create(
    engagementId: string,
    coachId: string,
    studentId: string,
    note: string
  ) {
    const { data, error } = await this.supabase
      .from("coach_notes")
      .insert({
        engagement_id: engagementId,
        coach_id: coachId,
        student_id: studentId,
        note,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCoachNoteRow(data);
  }

  async update(id: string, note: string) {
    const { data, error } = await this.supabase
      .from("coach_notes")
      .update({
        note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCoachNoteRow(data);
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from("coach_notes")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
