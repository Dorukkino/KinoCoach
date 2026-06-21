"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession } from "@/application/ports/IAuthService";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { SupabaseAdminAuthService } from "@/infrastructure/auth/SupabaseAdminAuthService";
import { createSmtpEmailService } from "@/infrastructure/email/SmtpEmailService";
import { getContainer } from "./lib";

function redirectAfterAuth(session: AuthSession): never {
  revalidatePath("/", "layout");
  if (session.role.isAdmin()) redirect("/admin/dashboard");
  if (session.role.isStudent()) redirect("/student/dashboard");
  redirect("/coach/dashboard");
}

export async function signInAction(email: string, password: string) {
  const container = await getContainer();
  const session = await container.auth.signIn(email, password);
  redirectAfterAuth(session);
}

export async function adminSignInAction(email: string, password: string) {
  const container = await getContainer();
  const session = await container.auth.signIn(email, password);
  if (!session.role.isAdmin()) {
    await container.auth.signOut();
    throw new Error("Bu giriş ekranı yalnızca admin kullanıcılar içindir.");
  }
  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function signUpCoachAction(
  email: string,
  password: string,
  fullName: string
) {
  const container = await getContainer();
  const session = await container.registerCoach.execute({
    email,
    password,
    fullName,
  });
  redirectAfterAuth(session);
}

export async function signOutAction() {
  const container = await getContainer();
  await container.auth.signOut();
}

export async function requestPasswordResetAction(email: string) {
  const admin = createSupabaseAdminClient();
  const adminAuth = new SupabaseAdminAuthService(admin);
  const siteUrl = await resolveSiteUrl();
  const redirectTo = `${siteUrl}/auth/update-password?mode=recovery`;
  const actionLink = await adminAuth.createPasswordRecoveryLink(
    email.trim(),
    redirectTo
  );

  await createSmtpEmailService().send({
    to: email.trim(),
    subject: "KinoCoach şifre sıfırlama bağlantın",
    html: passwordRecoveryHtml(actionLink),
    text: `Şifreni sıfırlamak için bağlantıyı aç: ${actionLink}`,
  });
}

async function resolveSiteUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

function passwordRecoveryHtml(actionLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a17;">
      <h2>Şifre sıfırlama</h2>
      <p>KinoCoach hesabın için şifre sıfırlama bağlantısı istendi.</p>
      <p>Yeni şifreni belirlemek için aşağıdaki bağlantıya tıkla:</p>
      <p>
        <a href="${actionLink}" style="display: inline-block; padding: 10px 14px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;">
          Şifremi sıfırla
        </a>
      </p>
      <p style="font-size: 12px; color: #807c72;">Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
    </div>
  `;
}
