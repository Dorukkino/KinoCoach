"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { BrandMark } from "@/presentation/components/ui/BrandMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSent(false);
    startTransition(async () => {
      try {
        await requestPasswordResetAction(email);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
      }
    });
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="flex items-center gap-2 mb-6">
          <BrandMark />
          <span className="font-semibold text-lg">KinoCoach</span>
        </div>
        <h1 className="text-xl font-bold m-0 mb-1">Şifremi unuttum</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          E-posta adresini gir; sana şifreni sıfırlamak için bir bağlantı
          gönderelim.
        </p>

        {sent ? (
          <div className="panel p-4 mb-4 border-[var(--accent)]">
            <p className="text-sm m-0">
              Bağlantı <strong>{email}</strong> adresine gönderildi. Gelen
              kutunu (ve spam klasörünü) kontrol et.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="label">E-posta</label>
            <input
              name="email"
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <p className="text-sm text-[var(--risk)] mb-3">{error}</p>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full justify-center"
              disabled={pending}
            >
              {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
            </button>
          </form>
        )}

        <p className="text-sm text-[var(--muted)] mt-4 text-center">
          <Link
            href="/login"
            className="text-[var(--accent-ink)] font-medium"
          >
            Girişe dön
          </Link>
        </p>
      </div>
    </div>
  );
}
