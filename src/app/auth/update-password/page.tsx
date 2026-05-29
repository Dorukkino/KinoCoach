"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/browser";
import { mapAuthError } from "@/infrastructure/auth/authErrors";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

function UpdatePasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // "invite" | "recovery" | null

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, startTransition] = useTransition();

  // Sayfa açıldığında:
  //  1) PKCE callback'ten geldiyse zaten oturum cookie'sinde var.
  //  2) Eski (hash tabanlı) magic-link akışındaysa URL'de #access_token=...
  //     gelir; supabase-js bunu otomatik yakalar, sadece getSession'ı bekleriz.
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.location.hash.includes("access_token")
        ) {
          const params = new URLSearchParams(window.location.hash.slice(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;

            // Token'lar URL'de kalmasın; sayfa yenilenirse cookie/local storage'daki
            // oturum kullanılacak.
            window.history.replaceState(
              null,
              "",
              `${window.location.pathname}${window.location.search}`
            );
          }
        }
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          setAuthError(mapAuthError(error.message));
        } else if (!data.session) {
          setAuthError(
            "Şifre belirleme bağlantın geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı talep et."
          );
        }
      } catch (err) {
        if (!active) return;
        setAuthError(err instanceof Error ? err.message : "Oturum doğrulanamadı");
      } finally {
        if (active) setReady(true);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [supabase]);

  const title = mode === "invite" ? "Şifreni belirle" : "Yeni şifre belirle";
  const description =
    mode === "invite"
      ? "Koçun seni davet etti. Hesabını aktif etmek için aşağıdan bir şifre belirle."
      : "Yeni şifreni belirleyip oturum aç.";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (password.length < 6) {
      setFormError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setFormError("Şifreler eşleşmiyor.");
      return;
    }
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setFormError(mapAuthError(error.message));
          return;
        }
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .single();
        const role = profile?.role === "student" ? "student" : "coach";
        router.replace(role === "student" ? "/student/dashboard" : "/coach/dashboard");
        router.refresh();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Şifre güncellenemedi");
      }
    });
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="flex items-center gap-2 mb-6">
          <div className="brand-mark">k</div>
          <span className="font-semibold text-lg">Kino</span>
        </div>
        <h1 className="text-xl font-bold m-0 mb-1">{title}</h1>
        <p className="text-sm text-[var(--muted)] mb-6">{description}</p>

        {!ready && (
          <p className="text-sm text-[var(--muted)]">Bağlantı doğrulanıyor…</p>
        )}

        {ready && authError && (
          <>
            <div className="panel p-4 mb-4 border-[var(--risk)]">
              <p className="text-sm m-0">{authError}</p>
            </div>
            <Link
              href="/forgot-password"
              className="btn btn-outline w-full justify-center"
            >
              Yeni bağlantı talep et
            </Link>
          </>
        )}

        {ready && !authError && (
          <form onSubmit={handleSubmit}>
            <label className="label">Yeni şifre</label>
            <input
              type="password"
              className="input"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label className="label">Şifreyi tekrar gir</label>
            <input
              type="password"
              className="input"
              minLength={6}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {formError && (
              <p className="text-sm text-[var(--risk)] mb-3">{formError}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full justify-center"
              disabled={pending}
            >
              {pending ? "Kaydediliyor…" : "Şifreyi kaydet"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="login-wrap">
          <div className="login-card">
            <LoadingScreen />
          </div>
        </div>
      }
    >
      <UpdatePasswordPageInner />
    </Suspense>
  );
}
