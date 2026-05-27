import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cleanEnv, getSupabaseUrl } from "./env";

let _admin: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  if (_admin) return _admin;
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  _admin = createClient(getSupabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}
