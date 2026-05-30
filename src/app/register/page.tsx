"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUpCoachAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await signUpCoachAction(
          String(fd.get("email")),
          String(fd.get("password")),
          String(fd.get("fullName"))
        );
        router.push("/coach/dashboard");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kayıt başarısız");
      }
    });
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="flex items-center gap-2 mb-6">
          <div className="brand-mark">k</div>
          <span className="font-semibold text-lg">KinoCoach</span>
        </div>
        <h1 className="text-xl font-bold m-0 mb-1">Koç kaydı</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Sadece koçlar kayıt olabilir. Öğrenciler koç tarafından eklenir.
        </p>
        <p className="text-xs text-[var(--muted-2)] mb-4 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
          Geliştirme için gerçek bir e-posta kullanın (ör. Gmail).{" "}
          <code className="text-[11px]">test@test.com</code> Supabase tarafından reddedilebilir.
          Rate limit hatası alırsanız 1 dakika bekleyin.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="label">Ad Soyad</label>
          <input name="fullName" className="input" required />
          <label className="label">E-posta</label>
          <input name="email" type="email" className="input" required />
          <label className="label">Şifre</label>
          <input name="password" type="password" className="input" minLength={6} required />
          {error && <p className="text-sm text-[var(--risk)] mb-3">{error}</p>}
          <button type="submit" className="btn btn-primary w-full justify-center" disabled={pending}>
            Kayıt ol
          </button>
        </form>
        <p className="text-sm text-[var(--muted)] mt-4 text-center">
          <Link href="/login" className="text-[var(--accent-ink)] font-medium">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
