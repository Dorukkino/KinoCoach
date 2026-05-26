"use server";

import { revalidatePath } from "next/cache";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { requireSession } from "./lib";

export async function getWeeklyProgramAction(
  studentId: string,
  weekStart: string
) {
  const { container } = await requireSession();
  return container.getWeeklyProgram.execute(studentId, new Date(weekStart));
}

export async function saveWeeklyProgramAction(
  studentId: string,
  weekStart: string,
  gridJson: unknown
) {
  const { container } = await requireSession();
  const grid = Grid7x10.fromJSON(gridJson);
  const result = await container.createWeeklyProgram.execute({
    studentId,
    weekStart: new Date(weekStart),
    grid,
  });
  revalidatePath(`/coach/students/${studentId}`);
  revalidatePath("/student/weekly");
  return result;
}

export async function listWeeklyWeekStartsAction(
  studentId: string
): Promise<string[]> {
  const { container } = await requireSession();
  return container.listStudentWeeks.execute(studentId);
}

export async function toggleWeeklyTaskAction(
  studentId: string,
  weekStart: string,
  row: number,
  col: number
) {
  const { container } = await requireSession();
  const result = await container.updateWeeklyCompletion.execute({
    studentId,
    weekStart: new Date(weekStart),
    row,
    col,
  });
  revalidatePath("/student/weekly");
  revalidatePath("/coach/weekly");
  return result;
}
