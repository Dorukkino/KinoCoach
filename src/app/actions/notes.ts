"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { requireCoach } from "./lib";
import { createAdminContainer } from "@/infrastructure/di/container";
import { listActiveStudentsAction } from "./students";
import {
  coachCacheTags,
  revalidateCoachNotes,
  revalidateCoachStudents,
} from "@/infrastructure/cache/revalidate-coach-cache";
import type { CoachNoteListItemDto } from "@/application/dto";

const CACHE_REVALIDATE_SECONDS = 30;

function getCachedCoachNotes(coachId: string): Promise<CoachNoteListItemDto[]> {
  return unstable_cache(
    async () => {
      const container = createAdminContainer();
      return container.listCoachNotes.execute(coachId);
    },
    ["coach-notes", coachId],
    {
      tags: [coachCacheTags.notes(coachId)],
      revalidate: CACHE_REVALIDATE_SECONDS,
    }
  )();
}

export async function upsertCoachNoteAction(studentId: string, note: string) {
  const { container, session } = await requireCoach();
  const result = await container.upsertCoachNote.execute(
    session.userId,
    studentId,
    note
  );
  revalidatePath("/coach/notes");
  revalidatePath(`/coach/students/${studentId}`);
  revalidateCoachStudents(session.userId);
  revalidateCoachNotes(session.userId);
  return result;
}

export async function updateCoachNoteAction(noteId: string, note: string) {
  const { container, session } = await requireCoach();
  const existing = await container.notes.findById(noteId);
  if (!existing) throw new Error("Not bulunamadı.");
  const result = await container.notes.update(noteId, note);
  revalidatePath("/coach/notes");
  revalidatePath(`/coach/students/${result.studentId}`);
  revalidateCoachStudents(session.userId);
  revalidateCoachNotes(session.userId);
  return {
    id: result.id,
    studentId: result.studentId,
    note: result.note,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function deleteCoachNoteAction(noteId: string) {
  const { container, session } = await requireCoach();
  const existing = await container.notes.findById(noteId);
  if (!existing) throw new Error("Not bulunamadı.");
  await container.notes.delete(noteId);
  revalidatePath("/coach/notes");
  revalidatePath(`/coach/students/${existing.studentId}`);
  revalidateCoachStudents(session.userId);
  revalidateCoachNotes(session.userId);
}

export async function getCoachNoteAction(studentId: string) {
  const { container, session } = await requireCoach();
  return container.getCoachNote.execute(session.userId, studentId);
}

export async function getCoachNotesPageDataAction() {
  const { session } = await requireCoach();
  const [students, notes] = await Promise.all([
    listActiveStudentsAction(),
    getCachedCoachNotes(session.userId),
  ]);
  return { students, notes };
}

export async function listCoachNotesAction() {
  const { session } = await requireCoach();
  return getCachedCoachNotes(session.userId);
}

export async function setMotivationAction(studentId: string, message: string) {
  const { container, session } = await requireCoach();
  await container.setMotivation.execute(session.userId, studentId, message);
  revalidatePath("/student/dashboard");
}

