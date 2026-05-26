"use server";

import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { requireSession } from "./lib";

export async function getLessonNetAction(studentId: string, weekStart: string) {
  const { container } = await requireSession();
  return container.getLessonNet.execute(studentId, new Date(weekStart));
}

export async function saveLessonNetAction(
  studentId: string,
  weekStart: string,
  gridJson: unknown
) {
  const { container } = await requireSession();
  const grid = Grid7x10.fromJSON(gridJson);
  return container.upsertLessonNet.execute({
    studentId,
    weekStart: new Date(weekStart),
    grid,
  });
}
