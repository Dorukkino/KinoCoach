import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _browser: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (_browser) return _browser;
  _browser = createBrowserClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  );
  return _browser;
}

function cleanEnv(value: string | undefined) {
  return value?.replace(/^\uFEFF/, "").trim();
}
