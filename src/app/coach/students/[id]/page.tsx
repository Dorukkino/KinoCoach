import { getStudentDetailAction } from "@/app/actions/students";
import { notFound } from "next/navigation";
import { StudentDetailClient } from "./StudentDetailClient";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudentDetailAction(id);
  if (!student) notFound();
  return <StudentDetailClient student={student} />;
}
