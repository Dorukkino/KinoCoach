import type { SerializeOptions } from "cookie";

type WritableResponseCookies = {
  set: (name: string, value: string, options?: SerializeOptions) => void;
  delete: (name: string) => void;
};

type CookieToSet = {
  name: string;
  value: string;
  options?: SerializeOptions;
};

const ALLOWED_COOKIE_KEYS = new Set([
  "path",
  "maxAge",
  "domain",
  "sameSite",
  "secure",
  "httpOnly",
  "expires",
]);

/** Next.js cookie API rejects extra keys (e.g. leaked `name` from Supabase options). */
export function sanitizeCookieOptions(
  options?: SerializeOptions
): SerializeOptions {
  const base: SerializeOptions = {
    path: "/",
    sameSite: "lax",
    ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
  };

  if (!options) return base;

  const sanitized: SerializeOptions = { ...base };
  for (const key of ALLOWED_COOKIE_KEYS) {
    const value = options[key as keyof SerializeOptions];
    if (value !== undefined) {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }
  return sanitized;
}

export function applyAuthResponseHeaders(
  target: { headers: { set: (name: string, value: string) => void } },
  headers?: Record<string, string>
) {
  if (!headers) return;
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) {
      target.headers.set(key, String(value));
    }
  }
}

export function setCookiesOnResponse(
  responseCookies: WritableResponseCookies,
  cookiesToSet: CookieToSet[]
) {
  for (const { name, value, options } of cookiesToSet) {
    if (!name) continue;
    const safe = sanitizeCookieOptions(options);
    if (value) {
      responseCookies.set(name, value, safe);
    } else {
      responseCookies.delete(name);
    }
  }
}

export type SupabaseSetAllCookies = (
  cookies: CookieToSet[],
  headers: Record<string, string>
) => void;
