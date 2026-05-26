import { createClient } from "@supabase/supabase-js";
import { cleanEnv, getSupabaseUrl } from "./env";

export function createSupabaseAdminClient() {
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(getSupabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
