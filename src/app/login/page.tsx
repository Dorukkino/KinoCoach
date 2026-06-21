"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
import { signInAction } from "@/app/actions/auth";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [error, setError] = useState(urlError ?? "");
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("kinoCoachLoginEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setError("");
    startTransition(async () => {
      try {
        if (rememberMe) {
          window.localStorage.setItem("kinoCoachLoginEmail", email);
        } else {
          window.localStorage.removeItem("kinoCoachLoginEmail");
        }
        await signInAction(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Giriş başarısız");
      }
    });
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden px-5 py-5 text-[var(--ink)]"
      style={{
        background:
          "radial-gradient(circle at 15% 18%, rgba(213, 241, 235, 0.82), transparent 30%), radial-gradient(circle at 84% 82%, rgba(245, 229, 214, 0.72), transparent 32%), #f8f7f4",
      }}
    >
      <header className="relative z-10 flex items-center justify-between text-[11px]">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="brand-mark">k</div>
          <span>KinoCoach</span>
        </Link>
        <p className="m-0 text-[var(--muted)]">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="font-semibold text-[var(--ink)]">
            Hemen başla
          </Link>
        </p>
      </header>

      <section className="relative z-10 min-h-[calc(100vh-96px)] flex items-center justify-center py-12">
        <div className="w-full max-w-[278px] rounded-[14px] border border-white/80 bg-white/88 p-6 shadow-[0_22px_60px_rgba(26,26,23,0.10)] backdrop-blur-md">
          <h1 className="font-serif text-[30px] leading-none tracking-[-0.04em] m-0">
            Tekrar hoş geldin.
          </h1>
          <p className="text-[11px] text-[var(--muted)] mt-2 mb-5">
            Devam etmek için hesabına giriş yap.
          </p>

          <form onSubmit={handleSubmit}>
            <label className="block text-[11px] font-semibold mb-1.5">
              E-posta
            </label>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <input
                name="email"
                type="email"
                className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-white pl-9 pr-3 text-[12px] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--ink)]"
                placeholder="ornek@kino.app"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <label className="block text-[11px] font-semibold mb-1.5">
              Şifre
            </label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-white pl-9 pr-9 text-[12px] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[var(--ink)]"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                onClick={() => setShowPassword((value) => !value)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 mb-4 text-[11px]">
              <label className="flex items-center gap-1.5 text-[var(--ink)]">
                <input
                  type="checkbox"
                  className="size-3 accent-[var(--ink)]"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Beni hatırla
              </label>
              <Link
                href="/forgot-password"
                className="font-medium text-[var(--accent-ink)]"
              >
                Şifremi unuttum
              </Link>
            </div>

            {error && (
              <p className="rounded-[10px] bg-[var(--risk-soft)] px-3 py-2 text-[11px] text-[var(--risk-ink)] mb-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="h-10 w-full rounded-[10px] bg-[var(--ink)] text-white text-[12px] font-semibold shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Giriş yapılıyor..." : "Giriş yap  →"}
            </button>
          </form>

          <p className="text-[11px] text-[var(--muted)] mt-4 mb-0 text-center">
            Yeni misin?{" "}
            <Link href="/register" className="font-semibold text-[var(--ink)]">
              Ücretsiz hesap aç
            </Link>
          </p>
        </div>
      </section>

      <footer className="relative z-10 flex items-center justify-between text-[10px] text-[var(--muted-2)]">
        <span>© 2026 KinoCoach Eğitim Teknolojileri</span>
        <span>tr · Türkiye</span>
      </footer>
    </main>
  );
}

export default function LoginPage() {
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
      <LoginPageInner />
    </Suspense>
  );
}
