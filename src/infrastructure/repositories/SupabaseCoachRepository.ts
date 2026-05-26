import { SupabaseClient } from "@supabase/supabase-js";
import { ICoachRepository } from "@/application/ports/ICoachRepository";
import { mapCoachRow } from "../supabase/mappers";

export class SupabaseCoachRepository implements ICoachRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return mapCoachRow(data);
  }
}
