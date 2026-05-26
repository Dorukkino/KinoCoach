export function cleanEnv(value: string | undefined): string | undefined {
  return value?.replace(/^\uFEFF/, "").trim();
}

export function getSupabaseUrl(): string {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL tanımlı değil");
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil");
  }
  return key;
}
