import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import { redirect } from "next/navigation";
import { StudentExamsTab } from "@/app/coach/students/[id]/tabs/StudentExamsTab";

export default async function StudentExamsPage() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");

  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Deneme Netlerim</h1>
        </div>
      </div>
      <StudentExamsTab studentId={student.id} role="student" />
    </div>
  );
}
