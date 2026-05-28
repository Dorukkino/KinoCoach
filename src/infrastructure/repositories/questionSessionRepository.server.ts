import "server-only";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { SupabaseQuestionSessionRepository } from "@/infrastructure/repositories/SupabaseQuestionSessionRepository";

let _repo: SupabaseQuestionSessionRepository | null = null;

export async function getQuestionSessionRepository() {
  if (!_repo) {
    const supabase = await createSupabaseServerClient();
    _repo = new SupabaseQuestionSessionRepository(supabase);
  }
  return _repo;
}
