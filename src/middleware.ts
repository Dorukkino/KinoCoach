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
      // Role kontrolünü layout'a bırakıyoruz — default coach dashboard'a yönlendir
      return NextResponse.redirect(
        new URL("/coach/dashboard", request.url)
      );
    }
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role kontrolünü layout'lara bırakıyoruz — middleware sadece auth guard
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
