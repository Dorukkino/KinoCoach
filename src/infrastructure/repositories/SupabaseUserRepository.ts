import { SupabaseClient } from "@supabase/supabase-js";
import { IUserRepository } from "@/application/ports/IUserRepository";
import { mapUserProfile } from "../supabase/mappers";
import { UserRole } from "@/domain/value-objects/UserRole";

const USER_COLUMNS = "id, email, role, full_name";

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select(USER_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapUserProfile(data);
  }

  async findByEmail(email: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select(USER_COLUMNS)
      .ilike("email", email)
      .maybeSingle();
    if (error || !data) return null;
    return mapUserProfile(data);
  }

  async create(profile: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
  }) {
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        id: profile.id,
        email: profile.email,
        role: profile.role.value,
        full_name: profile.fullName,
      })
      .select(USER_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapUserProfile(data);
  }

  async updateRole(id: string, role: UserRole) {
    const { error } = await this.supabase
      .from("users")
      .update({ role: role.value })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
