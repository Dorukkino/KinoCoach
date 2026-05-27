"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { revalidateCoachStudents } from "@/infrastructure/cache/revalidate-coach-cache";
import type { CoachingInvitationDto } from "@/application/dto";

export async function listMyPendingInvitationsAction(): Promise<
  CoachingInvitationDto[]
> {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return [];

  const invitations = await container.invitations.findPendingForStudent(
    student.id
  );
  if (invitations.length === 0) return [];

  const coachIds = Array.from(new Set(invitations.map((i) => i.coachId)));
  const coachNames = await fetchCoachNames(coachIds);

  return invitations.map((inv) => ({
    id: inv.id,
    studentId: inv.studentId,
    studentName: student.name,
    coachId: inv.coachId,
    coachName: coachNames.get(inv.coachId) ?? "Koç",
    status: inv.status,
    token: inv.token,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
  }));
}

export async function acceptInvitationAction(token: string) {
  const { container, session } = await requireSession();
  if (!container.acceptInvitation) {
    throw new Error(
      "Sunucu yapılandırma hatası: SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }
  const invitation = await container.invitations.findByToken(token);
  await container.acceptInvitation.execute(token, session.userId);
  if (invitation?.coachId) {
    revalidateCoachStudents(invitation.coachId);
  }
  revalidatePath("/student/dashboard");
  revalidatePath("/student/invitations");
}

export async function declineInvitationAction(token: string) {
  const { container, session } = await requireSession();
  const invitation = await container.invitations.findByToken(token);
  await container.declineInvitation.execute(token, session.userId);
  if (invitation?.coachId) {
    revalidateCoachStudents(invitation.coachId);
  }
  revalidatePath("/student/invitations");
}

/**
 * Yardımcı: davet token'ı üzerinden detayı getirir (öğrenci panelinde
 * davet sayfasında kullanılabilir).
 */
export async function getInvitationByTokenAction(token: string) {
  const { container } = await requireSession();
  const inv = await container.invitations.findByToken(token);
  if (!inv) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("users")
    .select("full_name, email")
    .eq("id", inv.coachId)
    .maybeSingle();
  const coachName = data?.full_name?.trim()
    ? data.full_name.trim()
    : data?.email?.split("@")[0] ?? "Koç";
  return {
    id: inv.id,
    studentId: inv.studentId,
    coachId: inv.coachId,
    coachName,
    status: inv.status,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
  };
}

async function fetchCoachNames(coachIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (coachIds.length === 0) return map;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("id, full_name, email")
      .in("id", coachIds);
    for (const row of data ?? []) {
      const full = String(row.full_name ?? "").trim();
      const email = String(row.email ?? "");
      map.set(
        String(row.id),
        full || email.split("@")[0] || "Koç"
      );
    }
  } catch {
    // ignore — UI fallback gösterecek
  }
  for (const id of coachIds) {
    if (!map.has(id)) map.set(id, "Koç");
  }
  return map;
}
