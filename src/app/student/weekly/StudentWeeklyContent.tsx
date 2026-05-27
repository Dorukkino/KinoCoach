import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import {
  getWeeklyProgramAction,
  listWeeklyWeekStartsAction,
} from "@/app/actions/weekly";
import { getWeekStartISO, mergeWeeksNearToday } from "@/lib/dates";
import { redirect } from "next/navigation";
import { StudentWeeklyTab } from "@/app/coach/students/[id]/tabs/StudentWeeklyTab";

export async function StudentWeeklyContent() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");

  const currentWeek = getWeekStartISO();
  const [dbWeeks, initialProgram] = await Promise.all([
    listWeeklyWeekStartsAction(student.id),
    getWeeklyProgramAction(student.id, currentWeek),
  ]);
  const initialWeeks = mergeWeeksNearToday(currentWeek, dbWeeks);

  return (
    <StudentWeeklyTab
      studentId={student.id}
      role="student"
      initialWeeks={initialWeeks}
      initialProgram={initialProgram}
      initialSelectedWeek={currentWeek}
    />
  );
}
