"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { SupabaseAdminAuthService } from "@/infrastructure/auth/SupabaseAdminAuthService";
import { mapAuthError } from "@/infrastructure/auth/authErrors";
import { createSmtpEmailService } from "@/infrastructure/email/SmtpEmailService";
import {
  AdminInvitationStatus,
  SupabaseAdminDashboardQuery,
} from "@/infrastructure/queries/SupabaseAdminDashboardQuery";
import { UserRole, UserRoleValue } from "@/domain/value-objects/UserRole";
import {
  EngagementStatus,
  EngagementStatusValue,
} from "@/domain/value-objects/EngagementStatus";
import { AccountStatus } from "@/application/ports/IAuthService";
import { NotificationType } from "@/domain/value-objects/NotificationType";

const ADMIN_PATHS = [
  "/admin/dashboard",
  "/admin/users",
  "/admin/engagements",
  "/admin/invitations",
];

export async function getAdminDashboardAction() {
  await requireAdmin();
  return new SupabaseAdminDashboardQuery(createSupabaseAdminClient()).getDashboard();
}

export async function listAdminUsersAction(input?: {
  query?: string;
  role?: UserRoleValue | "all";
  status?: AccountStatus | "all";
}) {
  await requireAdmin();
  return new SupabaseAdminDashboardQuery(createSupabaseAdminClient()).listUsers(
    input
  );
}

export async function listAdminEngagementsAction(input?: {
  query?: string;
  status?: EngagementStatusValue | "all";
}) {
  await requireAdmin();
  return new SupabaseAdminDashboardQuery(
    createSupabaseAdminClient()
  ).listEngagements(input);
}

export async function listAdminInvitationsAction(input?: {
  query?: string;
  status?: AdminInvitationStatus | "all";
}) {
  await requireAdmin();
  return new SupabaseAdminDashboardQuery(
    createSupabaseAdminClient()
  ).listInvitations(input);
}

export async function createAdminUserAction(formData: FormData) {
  const { session } = await requireAdmin();
  const admin = createSupabaseAdminClient();

  const email = required(formData, "email").trim().toLowerCase();
  const fullName = required(formData, "fullName").trim();
  const role = UserRole.from(required(formData, "role")).value;
  const grade = stringOrNull(formData.get("grade"));
  const track = stringOrNull(formData.get("track"));

  const { data: existingUser, error: existingError } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existingUser) throw new Error("Bu e-posta zaten kayıtlı.");

  const siteUrl = await resolveSiteUrl();
  const redirectTo = `${siteUrl}/auth/update-password?mode=invite`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { role, full_name: fullName },
      redirectTo,
    },
  });

  if (error) throw new Error(mapAuthError(error.message));
  if (!data.user) throw new Error("Kullanıcı oluşturulamadı.");
  const actionLink = data.properties?.action_link;
  if (!actionLink) throw new Error("Davet bağlantısı oluşturulamadı.");

  const { error: profileError } = await admin.from("users").upsert({
    id: data.user.id,
    email,
    role,
    full_name: fullName,
    account_status: "active",
  });
  if (profileError) throw new Error(profileError.message);

  if (role === "student") {
    const { error: studentError } = await admin.from("students").upsert(
      {
        user_id: data.user.id,
        name: fullName,
        grade,
        track,
        task_completion_rate: 0,
      },
      { onConflict: "user_id" }
    );
    if (studentError) throw new Error(studentError.message);
  }

  await createSmtpEmailService().send({
    to: email,
    subject: "KinoCoach hesabınız oluşturuldu",
    html: newUserInvitationHtml({
      fullName,
      role,
      actionLink,
      loginUrl: role === "admin" ? `${siteUrl}/admin/login` : `${siteUrl}/login`,
    }),
    text: `KinoCoach hesabınız oluşturuldu. Şifrenizi belirlemek için bağlantıyı açın: ${actionLink}`,
  });

  await audit(session.userId, "create_user", "user", data.user.id, { role });
  revalidateAdminPaths();
}

export async function updateAdminUserAction(formData: FormData) {
  const { session } = await requireAdmin();
  const admin = createSupabaseAdminClient();
  const auth = new SupabaseAdminAuthService(admin);

  const userId = required(formData, "userId");
  const fullName = required(formData, "fullName").trim();
  const role = UserRole.from(required(formData, "role")).value;
  const accountStatus = parseAccountStatus(required(formData, "accountStatus"));

  if (userId === session.userId && (role !== "admin" || accountStatus !== "active")) {
    throw new Error("Kendi admin erişiminizi kapatamazsınız.");
  }

  const { error } = await admin
    .from("users")
    .update({
      full_name: fullName,
      role,
      account_status: accountStatus,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  await auth.updateUserMetadata(userId, { role, fullName });
  await audit(session.userId, "update_user", "user", userId, {
    role,
    accountStatus,
  });
  revalidateAdminPaths();
}

export async function setEngagementStatusAction(formData: FormData) {
  const { session } = await requireAdmin();
  const admin = createSupabaseAdminClient();
  const engagementId = required(formData, "engagementId");
  const status = EngagementStatus.from(required(formData, "status")).value;
  const reason = stringOrNull(formData.get("reason"));

  const patch: Record<string, string | null> = { status };
  if (status === "ended") {
    patch.ended_at = new Date().toISOString();
    patch.end_reason = reason ?? "Admin tarafından sonlandırıldı";
  } else {
    patch.ended_at = null;
    patch.end_reason = null;
  }

  const { error } = await admin
    .from("coaching_engagements")
    .update(patch)
    .eq("id", engagementId);
  if (error) throw new Error(error.message);

  await audit(session.userId, "set_engagement_status", "engagement", engagementId, {
    status,
  });
  revalidateAdminPaths();
}

export async function setInvitationStatusAction(formData: FormData) {
  const { session } = await requireAdmin();
  const admin = createSupabaseAdminClient();
  const invitationId = required(formData, "invitationId");
  const status = parseInvitationStatus(required(formData, "status"));

  const { error } = await admin
    .from("coaching_invitations")
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("id", invitationId);
  if (error) throw new Error(error.message);

  await audit(session.userId, "set_invitation_status", "invitation", invitationId, {
    status,
  });
  revalidateAdminPaths();
}

export async function resendInvitationAction(formData: FormData) {
  const { container, session } = await requireAdmin();
  const admin = createSupabaseAdminClient();
  const invitationId = required(formData, "invitationId");
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { data: invitation, error } = await admin
    .from("coaching_invitations")
    .update({
      token,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      responded_at: null,
    })
    .eq("id", invitationId)
    .select("id, student_id, coach_id")
    .single();
  if (error) throw new Error(error.message);

  const { data: student } = await admin
    .from("students")
    .select("user_id, name, users(email)")
    .eq("id", String(invitation.student_id))
    .maybeSingle();
  const { data: coach } = await admin
    .from("users")
    .select("full_name")
    .eq("id", String(invitation.coach_id))
    .maybeSingle();

  const studentUser = Array.isArray(student?.users)
    ? student?.users[0]
    : student?.users;
  const studentEmail = String(studentUser?.email ?? "");
  if (studentEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
    await createSmtpEmailService().send({
      to: studentEmail,
      subject: "KinoCoach koçluk davetin yenilendi",
      html: refreshedInvitationHtml({
        studentName: String(student?.name ?? "Öğrenci"),
        coachName: String(coach?.full_name ?? "Koçun"),
        dashboardUrl: `${siteUrl}/student/dashboard`,
      }),
      text: `Koçluk davetin yenilendi. Daveti görmek için giriş yap: ${siteUrl}/student/dashboard`,
    });
  }

  if (student?.user_id && container.sendNotification) {
    await container.sendNotification.execute({
      userId: String(student.user_id),
      title: "Koçluk davetiniz yenilendi",
      message: "Bekleyen koçluk davetiniz yeniden gönderildi.",
      type: NotificationType.NEW_INVITATION,
      metadata: {
        coachId: String(invitation.coach_id),
        invitationId,
        href: "/student/dashboard",
      },
    });
  }

  await audit(session.userId, "resend_invitation", "invitation", invitationId, {
    expiresAt: expiresAt.toISOString(),
  });
  revalidateAdminPaths();
}

async function audit(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, string>
) {
  const { error } = await createSupabaseAdminClient()
    .from("admin_audit_events")
    .insert({
      admin_user_id: adminUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
    });
  if (error) throw new Error(error.message);
}

function required(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} zorunlu`);
  }
  return value;
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function parseAccountStatus(value: string): AccountStatus {
  if (value !== "active" && value !== "disabled") {
    throw new Error("Geçersiz hesap durumu");
  }
  return value;
}

function parseInvitationStatus(value: string): AdminInvitationStatus {
  if (
    value !== "pending" &&
    value !== "accepted" &&
    value !== "declined" &&
    value !== "expired"
  ) {
    throw new Error("Geçersiz davet durumu");
  }
  return value;
}

function revalidateAdminPaths() {
  for (const path of ADMIN_PATHS) revalidatePath(path);
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

function newUserInvitationHtml(input: {
  fullName: string;
  role: UserRoleValue;
  actionLink: string;
  loginUrl: string;
}): string {
  const roleLabel =
    input.role === "admin" ? "Admin" : input.role === "student" ? "Öğrenci" : "Koç";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a17;">
      <h2>KinoCoach hesabınız oluşturuldu</h2>
      <p>Merhaba ${escapeHtml(input.fullName)},</p>
      <p>Sizin için ${escapeHtml(roleLabel)} rolünde bir KinoCoach hesabı oluşturuldu.</p>
      <p>Şifrenizi belirlemek ve hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:</p>
      <p>
        <a href="${input.actionLink}" style="display: inline-block; padding: 10px 14px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;">
          Şifremi belirle
        </a>
      </p>
      <p style="font-size: 12px; color: #807c72;">Sonraki girişler için adres: ${input.loginUrl}</p>
    </div>
  `;
}

function refreshedInvitationHtml(input: {
  studentName: string;
  coachName: string;
  dashboardUrl: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a17;">
      <h2>Koçluk davetin yenilendi</h2>
      <p>Merhaba ${escapeHtml(input.studentName)},</p>
      <p>${escapeHtml(input.coachName)} tarafından gönderilen koçluk davetin yenilendi.</p>
      <p>Daveti görüntülemek ve yanıtlamak için paneline giriş yap:</p>
      <p>
        <a href="${input.dashboardUrl}" style="display: inline-block; padding: 10px 14px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px;">
          Panelime git
        </a>
      </p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
