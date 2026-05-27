import { getStudentDashboardAction } from "@/app/actions/dashboard";
import { listMyPendingInvitationsAction } from "@/app/actions/invitations";
import { ReadOnlyWeeklyGrid } from "@/presentation/components/weekly/ReadOnlyWeeklyGrid";
import { GridMatrix } from "@/application/dto";
import Link from "next/link";
import { StudentInvitationsBanner } from "./StudentInvitationsBanner";

export async function StudentDashboardContent() {
  const [data, invitations] = await Promise.all([
    getStudentDashboardAction(),
    listMyPendingInvitationsAction(),
  ]);
  if (!data) return <div>Profil bulunamadı.</div>;

  const hasProgram = data.totalTasks > 0;

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
        <div className="panel p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Bu haftaki programım
            </span>
            {hasProgram && (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                {data.completedTasks} / {data.totalTasks} görev
              </span>
            )}
          </div>

          {hasProgram && (
            <>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "var(--border)",
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${data.weeklyCompletion}%`,
                    borderRadius: 999,
                    background:
                      data.weeklyCompletion === 100
                        ? "var(--good)"
                        : "var(--accent)",
                    transition: "width 400ms ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color:
                      data.weeklyCompletion === 100
                        ? "var(--good-ink)"
                        : "var(--accent-ink)",
                    fontWeight: 600,
                  }}
                >
                  %{data.weeklyCompletion} tamamlandı
                </span>
              </div>
            </>
          )}

          <div style={{ overflowX: "auto" }}>
            <ReadOnlyWeeklyGrid grid={data.grid as GridMatrix} />
          </div>

          {!hasProgram && (
            <p
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginTop: 12,
                marginBottom: 0,
                textAlign: "center",
              }}
            >
              Koçun bu hafta henüz görev eklemedi.
            </p>
          )}
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
