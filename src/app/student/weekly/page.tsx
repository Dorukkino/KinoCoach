import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import { redirect } from "next/navigation";
import { StudentWeeklyTab } from "@/app/coach/students/[id]/tabs/StudentWeeklyTab";

export default async function StudentWeeklyPage() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");

  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Haftalık Programım</h1>
          <p>Görevleri tamamladıkça işaretleyin</p>
        </div>
      </div>
      <StudentWeeklyTab studentId={student.id} role="student" />
    </div>
  );
}
