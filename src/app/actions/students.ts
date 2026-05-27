"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireCoach } from "./lib";
import { ensureCoachProfile } from "./ensureCoachProfile";
import { getCachedActiveStudents, getCachedArchivedStudents } from "@/infrastructure/cache/coach-cache";
import {
  revalidateCoachStudentLists,
  revalidateCoachStudents,
} from "@/infrastructure/cache/revalidate-coach-cache";
import type { InviteStudentResult } from "@/application/use-cases/InviteStudentByEmailUseCase";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import type { ArchivedStudentRowDto } from "@/application/use-cases/ListArchivedStudentsForCoachUseCase";

async function resolveSiteUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export async function inviteStudentAction(input: {
  name: string;
  email: string;
  grade?: string;
  track?: string;
  schoolLevel?: string;
}): Promise<InviteStudentResult> {
  const { container, session } = await requireCoach();
  if (!container.inviteStudent) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY tanımlı değil");
  }
  const [, siteUrl] = await Promise.all([
    ensureCoachProfile(container, session),
    resolveSiteUrl(),
  ]);
  const inviteRedirectTo = `${siteUrl}/auth/update-password?mode=invite`;
  const result = await container.inviteStudent.execute({
    coachId: session.userId,
    ...input,
    inviteRedirectTo,
  });
  revalidatePath("/coach/students");
  revalidateCoachStudents(session.userId);
  return result;
}

/**
 * @deprecated Use {@link inviteStudentAction} instead. Kept for legacy callers.
 */
export async function addStudentAction(input: {
  name: string;
  email: string;
  grade?: string;
  track?: string;
}) {
  return inviteStudentAction(input);
}

export async function listActiveStudentsAction(): Promise<CoachStudentRowDto[]> {
  const { session } = await requireCoach();
  return getCachedActiveStudents(session.userId);
}

/**
 * @deprecated Use {@link listActiveStudentsAction} instead.
 */
export async function listStudentsAction(): Promise<CoachStudentRowDto[]> {
  return listActiveStudentsAction();
}

export async function listArchivedStudentsAction(): Promise<
  ArchivedStudentRowDto[]
> {
  const { session } = await requireCoach();
  return getCachedArchivedStudents(session.userId);
}

export async function getStudentDetailAction(studentId: string) {
  const { container, session } = await requireCoach();
  return container.getStudentDetail.execute(studentId, session.userId);
}

export async function endEngagementAction(
  engagementId: string,
  reason?: string
) {
  const { container, session } = await requireCoach();
  await container.endEngagement.execute(engagementId, session.userId, reason);
  revalidatePath("/coach/students");
  revalidatePath("/coach/dashboard");
  revalidateCoachStudentLists(session.userId);
}

/**
 * @deprecated Use {@link endEngagementAction} (engagementId tabanlı) yerine.
 * Geriye uyum için: verilen studentId'nin aktif engagement'ını sonlandırır.
 */
export async function deleteStudentAction(studentId: string) {
  const { container, session } = await requireCoach();
  const active = await container.engagements.findActiveByCoachAndStudent(
    session.userId,
    studentId
  );
  if (!active) {
    throw new Error("Aktif koçluk ilişkisi bulunamadı.");
  }
  await container.endEngagement.execute(active.id, session.userId);
  revalidatePath("/coach/students");
  revalidatePath("/coach/dashboard");
  revalidateCoachStudentLists(session.userId);
}
