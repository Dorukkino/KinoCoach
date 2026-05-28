import Link from "next/link";
import type { CoachingInvitationDto } from "@/application/dto";
import { StudentInvitationsBanner } from "./StudentInvitationsBanner";
import { StudentMotivationBanner } from "./StudentMotivationBanner";
import type { MotivationCardDto } from "@/application/dto";

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
}: {
  dashboard: StudentDashboardData;
  invitations: CoachingInvitationDto[];
}) {
  return (
    <>
      <p className="text-lg font-semibold m-0 mb-4">Merhaba, {dashboard.name}</p>
      <p className="text-sm text-[var(--muted)] m-0 mb-4">
        {dashboard.hasActiveCoach ? (
          <>
            Koçun: <strong>{dashboard.coachName}</strong>
          </>
        ) : (
          "Henüz aktif bir koçun yok."
        )}
      </p>

      <StudentInvitationsBanner invitations={invitations} />

      {!dashboard.hasActiveCoach && invitations.length === 0 && (
        <div className="panel p-6 mb-4 border-l-4 border-[var(--accent)]">
          <p className="font-semibold m-0 mb-1">Henüz bir koçun yok</p>
          <p className="text-sm text-[var(--muted)] m-0">
            Bir koç seni davet ettiğinde davet bu sayfada görünecek.
          </p>
        </div>
      )}

      {dashboard.hasActiveCoach && (
        <StudentMotivationBanner
          studentId={dashboard.studentId}
          initialMotivation={dashboard.motivation}
        />
      )}

      {dashboard.hasActiveCoach && (
        <div className="flex gap-3 flex-wrap">
          <Link href="/student/chat" className="btn btn-outline">
            Koça mesaj
          </Link>
        </div>
      )}
    </>
  );
}
