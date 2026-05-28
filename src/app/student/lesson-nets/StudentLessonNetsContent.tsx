import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import {
  listQuestionSessionsAction,
  listQuestionSessionWeeksAction,
} from "@/app/actions/question-sessions";
import { getWeekStartISO, mergeWeeksNearToday } from "@/lib/dates";
import { redirect } from "next/navigation";
import { StudentLessonNetClient } from "./StudentLessonNetClient";

export async function StudentLessonNetsContent() {
  const student = await getCurrentStudentRecordAction();
  if (!student) redirect("/login");

  const currentWeek = getWeekStartISO();
  const [sessions, dbWeeks] = await Promise.all([
    listQuestionSessionsAction(student.id, currentWeek),
    listQuestionSessionWeeksAction(student.id),
  ]);
  const weeks = mergeWeeksNearToday(currentWeek, dbWeeks);

  return (
    <StudentLessonNetClient
      studentId={student.id}
      initialSessions={sessions}
      initialWeeks={weeks}
      initialSelectedWeek={currentWeek}
    />
  );
}
