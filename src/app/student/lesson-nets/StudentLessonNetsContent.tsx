import { getCurrentStudentRecordAction } from "@/app/actions/dashboard";
import {
  listQuestionSessionsAction,
  listQuestionSessionWeeksAction,
} from "@/app/actions/question-sessions";
import { getWeekStartISO } from "@/lib/dates";
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
  const weeks = Array.from(new Set([currentWeek, ...dbWeeks]))
    .filter((w): w is string => typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  return (
    <StudentLessonNetClient
      studentId={student.id}
      initialSessions={sessions}
      initialWeeks={weeks}
      initialSelectedWeek={currentWeek}
    />
  );
}
