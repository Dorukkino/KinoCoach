import { getStudentDetailAction } from "@/app/actions/students";
import { notFound } from "next/navigation";
import { StudentDetailClient } from "./StudentDetailClient";

export async function StudentDetailContent({
  studentId,
}: {
  studentId: string;
}) {
  const student = await getStudentDetailAction(studentId);
  if (!student) notFound();
  return <StudentDetailClient student={student} />;
}
