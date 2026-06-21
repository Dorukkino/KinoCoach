"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "./lib";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { revalidateCoachCacheForStudent } from "@/infrastructure/cache/revalidate-coach-cache";

export async function listExamResultsAction(studentId: string) {
  const { container } = await assertCanAccessStudentExams(studentId);
  return container.listExamResults.execute(studentId);
}

export async function createExamResultAction(
  studentId: string,
  date: string,
  scores: { turkish: number; math: number; science: number; social: number; english?: number | null },
  note = ""
) {
  const { container, session } = await assertCanAccessStudentExams(studentId);
  const createdBy = session.role.isCoach() ? "coach" : "student";
  await container.updateExamResult.create(
    studentId,
    new Date(date),
    scores,
    note,
    createdBy
  );
  revalidatePath("/coach/exams");
  revalidatePath(`/coach/students/${studentId}`);
  revalidatePath("/student/exams");
  await revalidateCoachCacheForStudent(studentId);
}

async function assertCanAccessStudentExams(studentId: string) {
  const { container, session } = await requireSession();

  if (session.role.isCoach()) {
    const engagement = await container.engagements.findActiveByCoachAndStudent(
      session.userId,
      studentId
    );
    if (!engagement) {
      throw new Error("Bu öğrenciye erişim yetkiniz yok.");
    }
    return { container, session };
  }

  if (session.role.isStudent()) {
    const student = await container.students.findByUserId(session.userId);
    if (!student || student.id !== studentId) {
      throw new Error("Bu işlem için yetkiniz yok.");
    }
    return { container, session };
  }

  throw new Error("Forbidden");
}

async function assertCanMutateExamResult(examResultId: string) {
  const { container, session } = await requireSession();
  const supabase = await createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("exam_results")
    .select("student_id")
    .eq("id", examResultId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Kayıt bulunamadı.");

  const studentId = String(existing.student_id);
  await assertCanAccessStudentExams(studentId);
  return { container, session, studentId };
}

export async function updateExamResultAction(
  examResultId: string,
  date: string,
  scores: { turkish: number; math: number; science: number; social: number; english?: number | null },
  note = ""
) {
  const { container, studentId } = await assertCanMutateExamResult(examResultId);

  await container.updateExamResult.update(
    examResultId,
    scores,
    new Date(date),
    note
  );

  revalidatePath("/coach/exams");
  revalidatePath(`/coach/students/${studentId}`);
  revalidatePath("/student/exams");
  await revalidateCoachCacheForStudent(studentId);
}

export async function deleteExamResultAction(examResultId: string): Promise<void> {
  const { container, session, studentId } =
    await assertCanMutateExamResult(examResultId);

  await container.updateExamResult.delete(
    examResultId,
    session.role.isCoach() ? "coach" : "student"
  );

  revalidatePath("/coach/exams");
  revalidatePath(`/coach/students/${studentId}`);
  revalidatePath("/student/exams");
  await revalidateCoachCacheForStudent(studentId);
}
