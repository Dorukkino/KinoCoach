import { SupabaseClient } from "@supabase/supabase-js";
import { ICoachRepository } from "@/application/ports/ICoachRepository";
import { mapCoachRow } from "../supabase/mappers";

const COACH_COLUMNS = "id, email, full_name";

export class SupabaseCoachRepository implements ICoachRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select(COACH_COLUMNS)
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return mapCoachRow(data);
  }
}
