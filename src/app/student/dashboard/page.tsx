import { Suspense } from "react";
import { StudentDashboardRealtime } from "./StudentDashboardRealtime";
import { StudentDashboardContent } from "./StudentDashboardContent";
import { getStudentDashboardWithInvitationsAction } from "@/app/actions/dashboard";
import { listExamResultsAction } from "@/app/actions/exams";
import { listQuestionSessionsAction } from "@/app/actions/question-sessions";
import { getWeeklyProgramAction } from "@/app/actions/weekly";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";
import { getWeekStartISO } from "@/lib/dates";

async function StudentDashboardLoader() {
  const { dashboard, invitations } =
    await getStudentDashboardWithInvitationsAction();
  if (!dashboard) return <div>Profil bulunamadı.</div>;
  const weekStart = getWeekStartISO();
  const [weeklyProgram, examRows, questionSessions] = await Promise.all([
    getWeeklyProgramAction(dashboard.studentId, weekStart),
    listExamResultsAction(dashboard.studentId),
    listQuestionSessionsAction(dashboard.studentId, weekStart),
  ]);

  return (
    <>
      <StudentDashboardRealtime studentId={dashboard.studentId} />
      <StudentDashboardContent
        dashboard={dashboard}
        invitations={invitations}
        weeklyProgram={weeklyProgram}
        examRows={examRows}
        questionSessions={questionSessions}
        weekStart={weekStart}
      />
    </>
  );
}

export default function StudentDashboardPage() {
  return (
    <div className="screen student-dashboard-screen">
      <Suspense fallback={<LoadingScreen />}>
        <StudentDashboardLoader />
      </Suspense>
    </div>
  );
}
