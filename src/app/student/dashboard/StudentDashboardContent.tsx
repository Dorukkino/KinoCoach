import { getStudentDashboardAction } from "@/app/actions/dashboard";
import { listMyPendingInvitationsAction } from "@/app/actions/invitations";
import Link from "next/link";
import { StudentInvitationsBanner } from "./StudentInvitationsBanner";

export async function StudentDashboardContent() {
  const [data, invitations] = await Promise.all([
    getStudentDashboardAction(),
    listMyPendingInvitationsAction(),
  ]);
  if (!data) return <div>Profil bulunamadı.</div>;

  return (
    <>
      <p className="text-lg font-semibold m-0 mb-4">Merhaba, {data.name}</p>
      <p className="text-sm text-[var(--muted)] m-0 mb-4">
        {data.hasActiveCoach ? (
          <>
            Koçun: <strong>{data.coachName}</strong>
          </>
        ) : (
          "Henüz aktif bir koçun yok."
        )}
      </p>

      <StudentInvitationsBanner invitations={invitations} />

      {!data.hasActiveCoach && invitations.length === 0 && (
        <div className="panel p-6 mb-4 border-l-4 border-[var(--accent)]">
          <p className="font-semibold m-0 mb-1">Henüz bir koçun yok</p>
          <p className="text-sm text-[var(--muted)] m-0">
            Bir koç seni davet ettiğinde davet bu sayfada görünecek.
          </p>
        </div>
      )}

      {data.motivation && (
        <div className="panel p-6 mb-4 border-l-4 border-[var(--accent)]">
          <p className="text-xs font-semibold text-[var(--muted)] m-0 mb-1">
            {data.motivation.coachName} diyor ki
          </p>
          <p className="text-base m-0">{data.motivation.message}</p>
        </div>
      )}

      {data.hasActiveCoach && (
        <div className="flex gap-3 flex-wrap">
          <Link href="/student/chat" className="btn btn-outline">
            Koça mesaj
          </Link>
        </div>
      )}
    </>
  );
}
