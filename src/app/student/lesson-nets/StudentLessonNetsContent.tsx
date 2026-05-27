import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import { redirect } from "next/navigation";
import { StudentLessonNetClient } from "./StudentLessonNetClient";

export async function StudentLessonNetsContent() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");
  return <StudentLessonNetClient studentId={student.id} />;
}
