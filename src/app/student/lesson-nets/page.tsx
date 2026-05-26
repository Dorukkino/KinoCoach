import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import { redirect } from "next/navigation";
import { StudentLessonNetClient } from "./StudentLessonNetClient";

export default async function StudentLessonNetsPage() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");

  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Soru Çözüm Listem</h1>
          <p>Haftalık çözüm kayıtlarınız</p>
        </div>
      </div>
      <StudentLessonNetClient studentId={student.id} />
    </div>
  );
}
