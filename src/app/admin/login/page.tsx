"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { adminSignInAction } from "@/app/actions/auth";
import { BrandMark } from "@/presentation/components/ui/BrandMark";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

function AdminLoginPageInner() {
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
        await adminSignInAction(email, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Admin girişi başarısız");
      }
    });
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="flex items-center gap-2 mb-6">
          <BrandMark />
          <div>
            <span className="font-semibold text-lg block">KinoCoach Admin</span>
            <span className="text-xs text-[var(--muted)]">Yönetici erişimi</span>
          </div>
        </div>
        <h1 className="text-xl font-bold m-0 mb-1">Admin girişi</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Bu ekran yalnızca sistem yöneticileri içindir.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="label">Admin e-posta</label>
          <input name="email" type="email" className="input" required />
          <label className="label">Şifre</label>
          <input name="password" type="password" className="input" required />
          {error && <p className="text-sm text-[var(--risk)] mb-3">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            disabled={pending}
          >
            Admin paneline gir
          </button>
        </form>
        <p className="text-sm text-[var(--muted)] mt-4 text-center">
          Koç veya öğrenci misiniz?{" "}
          <Link href="/login" className="text-[var(--accent-ink)] font-medium">
            Normal girişe dön
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
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
      <AdminLoginPageInner />
    </Suspense>
  );
}
