import {
  listAdminInvitationsAction,
  resendInvitationAction,
  setInvitationStatusAction,
} from "@/app/actions/admin";
import {
  AdminBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  EmptyState,
  formatDate,
} from "../../_components/admin-ui";
import { AdminInvitationStatus } from "@/infrastructure/queries/SupabaseAdminDashboardQuery";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type BadgeTone = "default" | "good" | "warn" | "risk";

export default async function AdminInvitationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = asString(params.q);
  const status = parseStatus(asString(params.status));
  const invitations = await listAdminInvitationsAction({ query, status });

  return (
    <main className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Davet Yönetimi</h1>
          <p>Bekleyen, kabul edilen, reddedilen ve süresi geçen davetleri yönetin.</p>
        </div>
      </div>

      <form className="panel p-4 mb-5 grid md:grid-cols-[1fr_200px_auto] gap-3">
        <input
          name="q"
          defaultValue={query}
          className="input"
          placeholder="Öğrenci, e-posta veya koç ara"
        />
        <select name="status" defaultValue={status} className="input">
          <option value="all">Tüm durumlar</option>
          <option value="pending">Bekleyen</option>
          <option value="accepted">Kabul edildi</option>
          <option value="declined">Reddedildi</option>
          <option value="expired">Süresi geçti</option>
        </select>
        <button className="btn btn-primary justify-center" type="submit">
          Filtrele
        </button>
      </form>

      {invitations.length ? (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Öğrenci</AdminTh>
              <AdminTh>Koç</AdminTh>
              <AdminTh>Durum</AdminTh>
              <AdminTh>Tarih</AdminTh>
              <AdminTh>Aksiyon</AdminTh>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <AdminTd>
                  <div className="font-semibold">{invitation.studentName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {invitation.studentEmail || "E-posta yok"}
                  </div>
                </AdminTd>
                <AdminTd>{invitation.coachName}</AdminTd>
                <AdminTd>
                  <AdminBadge tone={statusTone(invitation.status)}>
                    {statusLabel(invitation.status)}
                  </AdminBadge>
                </AdminTd>
                <AdminTd>
                  <div>Oluşturma: {formatDate(invitation.createdAt)}</div>
                  <div className="text-xs text-[var(--muted)]">
                    Bitiş: {formatDate(invitation.expiresAt)}
                  </div>
                </AdminTd>
                <AdminTd>
                  <div className="flex flex-wrap gap-2">
                    <form action={setInvitationStatusAction}>
                      <input
                        type="hidden"
                        name="invitationId"
                        value={invitation.id}
                      />
                      <input type="hidden" name="status" value="expired" />
                      <button className="btn btn-outline text-xs" type="submit">
                        Süresini bitir
                      </button>
                    </form>
                    <form action={setInvitationStatusAction}>
                      <input
                        type="hidden"
                        name="invitationId"
                        value={invitation.id}
                      />
                      <input type="hidden" name="status" value="declined" />
                      <button className="btn btn-outline text-xs" type="submit">
                        İptal et
                      </button>
                    </form>
                    <form action={resendInvitationAction}>
                      <input
                        type="hidden"
                        name="invitationId"
                        value={invitation.id}
                      />
                      <button className="btn btn-primary text-xs" type="submit">
                        Yeniden gönder
                      </button>
                    </form>
                  </div>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : (
        <EmptyState>Bu filtrelerle davet bulunamadı.</EmptyState>
      )}
    </main>
  );
}

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseStatus(value: string): AdminInvitationStatus | "all" {
  if (
    value === "pending" ||
    value === "accepted" ||
    value === "declined" ||
    value === "expired"
  ) {
    return value;
  }
  return "all";
}

function statusLabel(status: AdminInvitationStatus) {
  if (status === "pending") return "Bekleyen";
  if (status === "accepted") return "Kabul edildi";
  if (status === "declined") return "Reddedildi";
  return "Süresi geçti";
}

function statusTone(status: AdminInvitationStatus): BadgeTone {
  if (status === "accepted") return "good";
  if (status === "pending") return "warn";
  return "risk";
}
