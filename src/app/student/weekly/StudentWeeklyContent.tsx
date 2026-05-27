import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import { redirect } from "next/navigation";
import { StudentWeeklyTab } from "@/app/coach/students/[id]/tabs/StudentWeeklyTab";

export async function StudentWeeklyContent() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");
  return <StudentWeeklyTab studentId={student.id} role="student" />;
}
