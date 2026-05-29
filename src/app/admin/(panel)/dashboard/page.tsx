import { getAdminDashboardAction } from "@/app/actions/admin";
import {
  AdminBadge,
  AdminLink,
  AdminStatCard,
  AdminTable,
  AdminTd,
  AdminTh,
  EmptyState,
  formatDate,
} from "../../_components/admin-ui";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardAction();

  return (
    <main className="screen">
      <div className="page-head">
        <div className="page-title">
          <p className="text-sm font-semibold text-[var(--accent-ink)] m-0">
            SaaS Yönetimi
          </p>
          <h1>Platform Özeti</h1>
        </div>
      </div>

      <section className="stats-row">
        {data.metrics.map((metric) => (
          <AdminStatCard key={metric.label} {...metric} />
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="panel p-5">
          <h2 className="text-base font-semibold m-0 mb-3">Kullanıcı rolleri</h2>
          <div className="space-y-2 text-sm">
            <Row label="Admin" value={data.userRoleCounts.admin} />
            <Row label="Koç" value={data.userRoleCounts.coach} />
            <Row label="Öğrenci" value={data.userRoleCounts.student} />
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-base font-semibold m-0 mb-3">İlişki durumları</h2>
          <div className="space-y-2 text-sm">
            <Row label="Aktif" value={data.engagementStatusCounts.active} />
            <Row label="Duraklatılmış" value={data.engagementStatusCounts.paused} />
            <Row label="Bitmiş" value={data.engagementStatusCounts.ended} />
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-base font-semibold m-0 mb-3">Davet durumları</h2>
          <div className="space-y-2 text-sm">
            <Row label="Bekleyen" value={data.invitationStatusCounts.pending} />
            <Row label="Kabul" value={data.invitationStatusCounts.accepted} />
            <Row label="Reddedilen" value={data.invitationStatusCounts.declined} />
            <Row label="Süresi geçen" value={data.invitationStatusCounts.expired} />
          </div>
        </div>
      </div>

      <section className="grid xl:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold m-0">Son kullanıcılar</h2>
            <AdminLink href="/admin/users">Tümünü gör</AdminLink>
          </div>
          {data.recentUsers.length ? (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Kullanıcı</AdminTh>
                  <AdminTh>Rol</AdminTh>
                  <AdminTh>Durum</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.id}>
                    <AdminTd>
                      <div className="font-semibold">{user.fullName || user.email}</div>
                      <div className="text-xs text-[var(--muted)]">{user.email}</div>
                    </AdminTd>
                    <AdminTd>{roleLabel(user.role)}</AdminTd>
                    <AdminTd>
                      <AdminBadge tone={user.accountStatus === "active" ? "good" : "risk"}>
                        {user.accountStatus === "active" ? "Aktif" : "Devre dışı"}
                      </AdminBadge>
                    </AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <EmptyState>Henüz kullanıcı yok.</EmptyState>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold m-0">Son ilişkiler</h2>
            <AdminLink href="/admin/engagements">Tümünü gör</AdminLink>
          </div>
          {data.recentEngagements.length ? (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Öğrenci</AdminTh>
                  <AdminTh>Koç</AdminTh>
                  <AdminTh>Durum</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.recentEngagements.map((engagement) => (
                  <tr key={engagement.id}>
                    <AdminTd>{engagement.studentName}</AdminTd>
                    <AdminTd>{engagement.coachName}</AdminTd>
                    <AdminTd>
                      <AdminBadge tone={engagementTone(engagement.status)}>
                        {engagementLabel(engagement.status)}
                      </AdminBadge>
                    </AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <EmptyState>Henüz koç-öğrenci ilişkisi yok.</EmptyState>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold m-0">Son davetler</h2>
            <AdminLink href="/admin/invitations">Tümünü gör</AdminLink>
          </div>
          {data.recentInvitations.length ? (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Öğrenci</AdminTh>
                  <AdminTh>Koç</AdminTh>
                  <AdminTh>Bitiş</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.recentInvitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <AdminTd>{invitation.studentName}</AdminTd>
                    <AdminTd>{invitation.coachName}</AdminTd>
                    <AdminTd>{formatDate(invitation.expiresAt)}</AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <EmptyState>Henüz davet yok.</EmptyState>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold m-0 mb-3">Admin audit</h2>
          {data.recentAuditEvents.length ? (
            <AdminTable>
              <thead>
                <tr>
                  <AdminTh>Aksiyon</AdminTh>
                  <AdminTh>Hedef</AdminTh>
                  <AdminTh>Tarih</AdminTh>
                </tr>
              </thead>
              <tbody>
                {data.recentAuditEvents.map((event) => (
                  <tr key={event.id}>
                    <AdminTd>{event.action}</AdminTd>
                    <AdminTd>{event.targetType}</AdminTd>
                    <AdminTd>{formatDate(event.createdAt)}</AdminTd>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          ) : (
            <EmptyState>Henüz admin aksiyonu yok.</EmptyState>
          )}
        </div>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "student") return "Öğrenci";
  return "Koç";
}

function engagementLabel(status: string) {
  if (status === "active") return "Aktif";
  if (status === "paused") return "Duraklatılmış";
  return "Bitmiş";
}

function engagementTone(status: string) {
  if (status === "active") return "good";
  if (status === "paused") return "warn";
  return "risk";
}
