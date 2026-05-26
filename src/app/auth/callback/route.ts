import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

/**
 * Supabase davet / şifre sıfırlama / OTP linklerinin döndüğü endpoint.
 *
 * PKCE akışında URL'de `?code=...` parametresi olur; bunu cookie tabanlı
 * server-side oturumla takas ederiz. `?next=...` parametresi varsa
 * doğrulama başarılı olduğunda oraya yönlendiririz; yoksa anasayfaya.
 *
 * Eski (hash tabanlı) magic-link e-posta şablonu da hâlâ kullanımdaysa
 * o linkler tarayıcıya `#access_token=...` ile döner ve bu route'a hiç
 * uğramaz — o durumda /auth/update-password sayfası hash'i kendi okur.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description");
  const nextParam = url.searchParams.get("next") ?? "/";
  const safeNext = nextParam.startsWith("/") ? nextParam : "/";

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription)}`,
        url.origin
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL(safeNext, url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Bağlantı doğrulanamadı. Lütfen yeni bir bağlantı talep edin."
        )}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
