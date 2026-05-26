"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "./lib";

export async function listExamResultsAction(studentId: string) {
  const { container } = await requireSession();
  return container.listExamResults.execute(studentId);
}

export async function createExamResultAction(
  studentId: string,
  date: string,
  scores: { turkish: number; math: number; science: number; social: number; english?: number | null },
  note = ""
) {
  const { container } = await requireSession();
  await container.updateExamResult.create(studentId, new Date(date), scores, note);
  revalidatePath("/coach/exams");
  revalidatePath(`/coach/students/${studentId}`);
  revalidatePath("/student/exams");
}
