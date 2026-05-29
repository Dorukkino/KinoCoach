import { getStudentDetailAction } from "@/app/actions/students";
import { listExamResultsAction } from "@/app/actions/exams";
import { getCoachNoteAction } from "@/app/actions/notes";
import {
  getWeeklyProgramAction,
  listWeeklyWeekStartsAction,
} from "@/app/actions/weekly";
import { getWeekStartISO, mergeWeeksNearToday } from "@/lib/dates";
import { notFound } from "next/navigation";
import { StudentDetailClient } from "./StudentDetailClient";

const DETAIL_TABS = ["overview", "weekly", "exams", "lesson-nets", "notes"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

function resolveTab(tab?: string): DetailTab {
  if (tab && DETAIL_TABS.includes(tab as DetailTab)) return tab as DetailTab;
  return "overview";
}

export async function StudentDetailContent({
  studentId,
  initialTab,
}: {
  studentId: string;
  initialTab?: string;
}) {
  const student = await getStudentDetailAction(studentId);
  if (!student) notFound();

  const tab = resolveTab(initialTab);
  const currentWeek = getWeekStartISO();

  const [initialExamRows, dbWeeks, initialWeeklyProgram, initialNotes] =
    await Promise.all([
      listExamResultsAction(studentId),
      listWeeklyWeekStartsAction(studentId),
      getWeeklyProgramAction(studentId, currentWeek),
      getCoachNoteAction(studentId),
    ]);
  const initialWeeklyWeeks = mergeWeeksNearToday(currentWeek, dbWeeks);
  const initialWeeklySelectedWeek = currentWeek;

  return (
    <StudentDetailClient
      student={student}
      initialTab={tab}
      initialExamRows={initialExamRows}
      initialWeeklyWeeks={initialWeeklyWeeks}
      initialWeeklyProgram={initialWeeklyProgram}
      initialWeeklySelectedWeek={initialWeeklySelectedWeek}
      initialNotes={initialNotes}
    />
  );
}
