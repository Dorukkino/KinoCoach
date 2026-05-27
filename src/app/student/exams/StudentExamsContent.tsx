import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import { listExamResultsAction } from "@/app/actions/exams";
import { redirect } from "next/navigation";
import { StudentExamsTab } from "@/app/coach/students/[id]/tabs/StudentExamsTab";

export async function StudentExamsContent() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");
  const initialRows = await listExamResultsAction(student.id);
  return (
    <StudentExamsTab
      studentId={student.id}
      role="student"
      initialRows={initialRows}
    />
  );
}
