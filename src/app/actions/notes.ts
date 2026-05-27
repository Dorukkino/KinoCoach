"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "./lib";

export async function upsertCoachNoteAction(studentId: string, note: string) {
  const { container, session } = await requireCoach();
  const result = await container.upsertCoachNote.execute(
    session.userId,
    studentId,
    note
  );
  revalidatePath("/coach/notes");
  revalidatePath(`/coach/students/${studentId}`);
  return result;
}

export async function updateCoachNoteAction(noteId: string, note: string) {
  const { container } = await requireCoach();
  const existing = await container.notes.findById(noteId);
  if (!existing) throw new Error("Not bulunamadı.");
  const result = await container.notes.update(noteId, note);
  revalidatePath("/coach/notes");
  revalidatePath(`/coach/students/${result.studentId}`);
  return {
    id: result.id,
    studentId: result.studentId,
    note: result.note,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function deleteCoachNoteAction(noteId: string) {
  const { container } = await requireCoach();
  const existing = await container.notes.findById(noteId);
  if (!existing) throw new Error("Not bulunamadı.");
  await container.notes.delete(noteId);
  revalidatePath("/coach/notes");
  revalidatePath(`/coach/students/${existing.studentId}`);
}

export async function getCoachNoteAction(studentId: string) {
  const { container, session } = await requireCoach();
  return container.getCoachNote.execute(session.userId, studentId);
}

export async function listCoachNotesAction() {
  const { container, session } = await requireCoach();
  return container.listCoachNotes.execute(session.userId);
}

export async function setMotivationAction(studentId: string, message: string) {
  const { container, session } = await requireCoach();
  await container.setMotivation.execute(session.userId, studentId, message);
  revalidatePath("/student/dashboard");
}
