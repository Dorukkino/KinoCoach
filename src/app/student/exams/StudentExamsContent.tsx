import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import { redirect } from "next/navigation";
import { StudentExamsTab } from "@/app/coach/students/[id]/tabs/StudentExamsTab";

export async function StudentExamsContent() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");
  return <StudentExamsTab studentId={student.id} role="student" />;
}
