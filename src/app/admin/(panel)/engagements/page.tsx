import {
  listAdminEngagementsAction,
  setEngagementStatusAction,
} from "@/app/actions/admin";
import {
  AdminBadge,
  AdminTable,
  AdminTd,
  AdminTh,
  EmptyState,
  formatDate,
} from "../../_components/admin-ui";
import { EngagementStatusValue } from "@/domain/value-objects/EngagementStatus";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type BadgeTone = "default" | "good" | "warn" | "risk";

export default async function AdminEngagementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = asString(params.q);
  const status = parseStatus(asString(params.status));
  const engagements = await listAdminEngagementsAction({ query, status });

  return (
    <main className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Koç-Öğrenci İlişkileri</h1>
          <p>Aktif, duraklatılmış ve bitmiş koçluk ilişkilerini yönetin.</p>
        </div>
      </div>

      <form className="panel p-4 mb-5 grid md:grid-cols-[1fr_200px_auto] gap-3">
        <input
          name="q"
          defaultValue={query}
          className="input"
          placeholder="Öğrenci veya koç ara"
        />
        <select name="status" defaultValue={status} className="input">
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="paused">Duraklatılmış</option>
          <option value="ended">Bitmiş</option>
        </select>
        <button className="btn btn-primary justify-center" type="submit">
          Filtrele
        </button>
      </form>

      {engagements.length ? (
        <AdminTable>
          <thead>
            <tr>
              <AdminTh>Öğrenci</AdminTh>
              <AdminTh>Koç</AdminTh>
              <AdminTh>Durum</AdminTh>
              <AdminTh>Başlangıç</AdminTh>
              <AdminTh>Aksiyon</AdminTh>
            </tr>
          </thead>
          <tbody>
            {engagements.map((engagement) => (
              <tr key={engagement.id}>
                <AdminTd>
                  <div className="font-semibold">{engagement.studentName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {[engagement.gradeAtStart, engagement.track]
                      .filter(Boolean)
                      .join(" · ") || "Akademik bilgi yok"}
                  </div>
                </AdminTd>
                <AdminTd>{engagement.coachName}</AdminTd>
                <AdminTd>
                  <AdminBadge tone={statusTone(engagement.status)}>
                    {statusLabel(engagement.status)}
                  </AdminBadge>
                  {engagement.endReason && (
                    <div className="text-xs text-[var(--muted)] mt-2">
                      {engagement.endReason}
                    </div>
                  )}
                </AdminTd>
                <AdminTd>
                  <div>{formatDate(engagement.startedAt)}</div>
                  {engagement.endedAt && (
                    <div className="text-xs text-[var(--muted)]">
                      Bitiş: {formatDate(engagement.endedAt)}
                    </div>
                  )}
                </AdminTd>
                <AdminTd>
                  <form action={setEngagementStatusAction} className="grid gap-2">
                    <input type="hidden" name="engagementId" value={engagement.id} />
                    <select
                      name="status"
                      defaultValue={engagement.status}
                      className="input min-w-40"
                    >
                      <option value="active">Aktif</option>
                      <option value="paused">Duraklat</option>
                      <option value="ended">Sonlandır</option>
                    </select>
                    <input
                      name="reason"
                      className="input"
                      placeholder="Sonlandırma notu"
                    />
                    <button className="btn btn-primary justify-center" type="submit">
                      Güncelle
                    </button>
                  </form>
                </AdminTd>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      ) : (
        <EmptyState>Bu filtrelerle ilişki bulunamadı.</EmptyState>
      )}
    </main>
  );
}

function asString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseStatus(value: string): EngagementStatusValue | "all" {
  if (value === "active" || value === "paused" || value === "ended") return value;
  return "all";
}

function statusLabel(status: EngagementStatusValue) {
  if (status === "active") return "Aktif";
  if (status === "paused") return "Duraklatılmış";
  return "Bitmiş";
}

function statusTone(status: EngagementStatusValue): BadgeTone {
  if (status === "active") return "good";
  if (status === "paused") return "warn";
  return "risk";
}
