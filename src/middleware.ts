import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/infrastructure/supabase/env";
import {
  applyAuthResponseHeaders,
  setCookiesOnResponse,
} from "@/infrastructure/supabase/cookies";

const PUBLIC = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/auth/callback",
  "/auth/update-password",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        setCookiesOnResponse(response.cookies, cookiesToSet);
        applyAuthResponseHeaders(response, headers);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (PUBLIC.some((p) => path === p)) {
    if (user && (path === "/login" || path === "/register")) {
      const role = await fetchRole(supabase, user.id);
      return NextResponse.redirect(
        new URL(role === "student" ? "/student/dashboard" : "/coach/dashboard", request.url)
      );
    }
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = await fetchRole(supabase, user.id);

  if (path.startsWith("/coach") && role !== "coach") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
  }

  if (path.startsWith("/student") && role !== "student") {
    return NextResponse.redirect(new URL("/coach/dashboard", request.url));
  }

  return response;
}

async function fetchRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
) {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? "coach";
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
