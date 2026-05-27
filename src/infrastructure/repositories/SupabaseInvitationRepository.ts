import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateInvitationInput,
  IInvitationRepository,
} from "@/application/ports/IInvitationRepository";
import { mapInvitationRow } from "../supabase/mappers";

const INVITATION_COLUMNS =
  "id, student_id, coach_id, status, token, expires_at, created_at, responded_at";

export class SupabaseInvitationRepository implements IInvitationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByToken(token: string) {
    const { data, error } = await this.supabase
      .from("coaching_invitations")
      .select(INVITATION_COLUMNS)
      .eq("token", token)
      .maybeSingle();
    if (error || !data) return null;
    return mapInvitationRow(data);
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("coaching_invitations")
      .select(INVITATION_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapInvitationRow(data);
  }

  async findPendingForStudent(studentId: string) {
    const { data, error } = await this.supabase
      .from("coaching_invitations")
      .select(INVITATION_COLUMNS)
      .eq("student_id", studentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapInvitationRow);
  }

  async findByCoach(coachId: string) {
    const { data, error } = await this.supabase
      .from("coaching_invitations")
      .select(INVITATION_COLUMNS)
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapInvitationRow);
  }

  async create(input: CreateInvitationInput) {
    const { data, error } = await this.supabase
      .from("coaching_invitations")
      .insert({
        student_id: input.studentId,
        coach_id: input.coachId,
        token: input.token,
        expires_at: input.expiresAt.toISOString(),
        status: "pending",
      })
      .select(INVITATION_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapInvitationRow(data);
  }

  async markAccepted(id: string) {
    const { error } = await this.supabase
      .from("coaching_invitations")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async markDeclined(id: string) {
    const { error } = await this.supabase
      .from("coaching_invitations")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
