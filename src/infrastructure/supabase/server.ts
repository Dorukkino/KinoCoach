import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { sanitizeCookieOptions } from "./cookies";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, sanitizeCookieOptions(options))
          );
        } catch (error) {
          // Server Component: cookies read-only; middleware refreshes session.
          if (process.env.NODE_ENV === "development") {
            console.warn("[supabase] cookieStore.set failed", error);
          }
        }
        void headers;
      },
    },
  });
}
