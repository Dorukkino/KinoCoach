"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { signInAction } from "@/app/actions/auth";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [error, setError] = useState(urlError ?? "");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    startTransition(async () => {
      try {
        const { role } = await signInAction(email, password);
        router.push(role === "student" ? "/student/dashboard" : "/coach/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Giriş başarısız");
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
        <h1 className="text-xl font-bold m-0 mb-1">Giriş yap</h1>
        <p className="text-sm text-[var(--muted)] mb-6">E-posta ve şifrenizle devam edin</p>
        <form onSubmit={handleSubmit}>
          <label className="label">E-posta</label>
          <input name="email" type="email" className="input" required />
          <label className="label">Şifre</label>
          <input name="password" type="password" className="input" required />
          {error && <p className="text-sm text-[var(--risk)] mb-3">{error}</p>}
          <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending}>
            Giriş yap
          </button>
        </form>
        <p className="text-sm text-[var(--muted)] mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-[var(--accent-ink)] font-medium"
          >
            Şifremi unuttum
          </Link>
        </p>
        <p className="text-sm text-[var(--muted)] mt-2 text-center">
          Koç hesabı yok mu?{" "}
          <Link href="/register" className="text-[var(--accent-ink)] font-medium">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-wrap">
          <div className="login-card">
            <p className="text-sm text-[var(--muted)]">Yükleniyor…</p>
          </div>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
