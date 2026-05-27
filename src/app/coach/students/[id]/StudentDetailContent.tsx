import { getStudentDetailAction } from "@/app/actions/students";
import { listExamResultsAction } from "@/app/actions/exams";
import { getCoachNoteAction } from "@/app/actions/notes";
import {
  getWeeklyProgramAction,
  listWeeklyWeekStartsAction,
} from "@/app/actions/weekly";
import type { CoachNoteDto, ExamResultDto, WeeklyProgramDto } from "@/application/dto";
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

  let initialExamRows: ExamResultDto[] | undefined;
  let initialWeeklyWeeks: string[] | undefined;
  let initialWeeklyProgram: WeeklyProgramDto | null | undefined;
  let initialWeeklySelectedWeek: string | undefined;
  let initialNotes: CoachNoteDto[] | undefined;

  if (tab === "exams") {
    initialExamRows = await listExamResultsAction(studentId);
  } else if (tab === "weekly") {
    const [dbWeeks, program] = await Promise.all([
      listWeeklyWeekStartsAction(studentId),
      getWeeklyProgramAction(studentId, currentWeek),
    ]);
    initialWeeklyWeeks = mergeWeeksNearToday(currentWeek, dbWeeks);
    initialWeeklyProgram = program;
    initialWeeklySelectedWeek = currentWeek;
  } else if (tab === "notes") {
    initialNotes = await getCoachNoteAction(studentId);
  }

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
