import type {
  CoachingInvitationDto,
  ExamResultDto,
  WeeklyProgramDto,
} from "@/application/dto";
import type { QuestionSessionDto } from "@/app/actions/question-sessions";
import { StudentInvitationsBanner } from "./StudentInvitationsBanner";
import type { MotivationCardDto } from "@/application/dto";
import { StudentDashboardOverview } from "./StudentDashboardOverview";

export interface StudentDashboardData {
  studentId: string;
  name: string;
  coachName: string | null;
  motivation: MotivationCardDto | null;
  hasActiveCoach: boolean;
}

export function StudentDashboardContent({
  dashboard,
  invitations,
  weeklyProgram,
  examRows,
  questionSessions,
  weekStart,
}: {
  dashboard: StudentDashboardData;
  invitations: CoachingInvitationDto[];
  weeklyProgram: WeeklyProgramDto | null;
  examRows: ExamResultDto[];
  questionSessions: QuestionSessionDto[];
  weekStart: string;
}) {
  return (
    <>
      <StudentInvitationsBanner
        studentId={dashboard.studentId}
        invitations={invitations}
      />

      {!dashboard.hasActiveCoach && invitations.length === 0 && (
        <div className="panel p-6 mb-4 border-l-4 border-[var(--accent)]">
          <p className="font-semibold m-0 mb-1">Henüz bir koçun yok</p>
          <p className="text-sm text-[var(--muted)] m-0">
            Bir koç seni davet ettiğinde davet bu sayfada görünecek.
          </p>
        </div>
      )}

      <StudentDashboardOverview
        dashboard={dashboard}
        initialProgram={weeklyProgram}
        initialExamRows={examRows}
        initialQuestionSessions={questionSessions}
        weekStart={weekStart}
      />
    </>
  );
}
