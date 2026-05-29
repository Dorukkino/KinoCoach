"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StudentCard } from "@/presentation/components/students/StudentCard";
import {
  inviteStudentAction,
  endEngagementAction,
} from "@/app/actions/students";
import { Icons } from "@/presentation/components/icons";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import { useCoachClientCache } from "@/presentation/providers/CoachClientCacheProvider";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import type { ArchivedStudentRowDto } from "@/application/use-cases/ListArchivedStudentsForCoachUseCase";

type Tab = "active" | "archived";
type ViewMode = "grid" | "list";

export function StudentsPageClient({
  initialActive,
  initialArchived,
}: {
  initialActive: CoachStudentRowDto[];
  initialArchived: ArchivedStudentRowDto[];
}) {
  const router = useRouter();
  const { setStudents, patchActiveStudents } = useCoachClientCache();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [active, setActive] = useState(initialActive);
  const [archived, setArchived] = useState(initialArchived);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAdd, setShowAdd] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState<string | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setActive(initialActive);
    setArchived(initialArchived);
    setStudents({ active: initialActive, archived: initialArchived });
  }, [initialActive, initialArchived, setStudents]);

  const refreshStudents = useCallback(() => {
    router.refresh();
  }, [router]);

  useSupabaseTableRealtime({
    channelName: "coach-students-engagements",
    table: "coaching_engagements",
    onChange: refreshStudents,
  });

  useSupabaseTableRealtime({
    channelName: "coach-students-invitations",
    table: "coaching_invitations",
    onChange: refreshStudents,
  });

  useSupabaseTableRealtime({
    channelName: "coach-students-profiles",
    table: "students",
    onChange: refreshStudents,
  });

  let list = active;
  if (filter !== "all") list = list.filter((s) => s.status === filter);
  if (q) list = list.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  const counts = active.reduce(
    (a, s) => {
      a[s.status] = (a[s.status] ?? 0) + 1;
      return a;
    },
    {} as Record<string, number>
  );

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      try {
        const result = await inviteStudentAction({
          name: String(fd.get("name")),
          email: String(fd.get("email")),
          grade: String(fd.get("grade") || "") || undefined,
          track: String(fd.get("track") || "") || undefined,
          schoolLevel: String(fd.get("schoolLevel") || "") || undefined,
        });
        if (result.outcome === "invited_existing_student") {
          setInvitationMessage(
            "Bu öğrenci sistemde zaten kayıtlıydı. Davet öğrencinin paneline düştü; bir sonraki girişinde görecek."
          );
        } else if (result.outcome === "created_with_engagement") {
          setInvitationMessage(
            "Öğrenciye davet e-postası gönderildi. Maildeki bağlantıyla şifresini belirleyip giriş yapabilir."
          );
        }
        setShowAdd(false);
        form.reset();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Hata");
      }
    });
  };

  const handleEnd = (engagementId: string, studentName: string) => {
    if (
      !confirm(
        `"${studentName}" ile koçluk ilişkisini sonlandırmak istediğinden emin misin?\n\nÖğrencinin geçmiş verisi korunur; sadece artık sizin listenizde görünmez.`
      )
    )
      return;
    startTransition(async () => {
      try {
        await endEngagementAction(engagementId);
        setActive((prev) => prev.filter((s) => s.engagementId !== engagementId));
        patchActiveStudents((prev) =>
          prev.filter((s) => s.engagementId !== engagementId)
        );
        router.refresh();
      } catch (err) {
        alert(
          err instanceof Error ? err.message : "İlişki sonlandırılamadı."
        );
      }
    });
  };

  const statusFilters = [
    ["all", "Tümü", active.length, "all"],
    ["green", "İyi", counts.green ?? 0, "green"],
    ["yellow", "Ortalama", counts.yellow ?? 0, "yellow"],
    ["red", "Riskli", counts.red ?? 0, "red"],
  ] as [string, string, number, string][];

  return (
    <div className="screen students-screen">
      <div className="students-page-head">
        <div className="students-page-title">
          <h1>Öğrencilerim</h1>
          <p>
            {active.length} öğrenci · {counts.red ?? 0} riskli ·{" "}
            {counts.yellow ?? 0} ortalama · {counts.green ?? 0} iyi gidiyor
          </p>
        </div>
        <div className="students-head-actions">
          <button
            type="button"
            className="students-add-btn"
            onClick={() => setShowAdd(true)}
          >
            <Icons.Plus /> Öğrenci Ekle
          </button>
        </div>
      </div>

      {invitationMessage && (
        <div className="panel p-4 mb-4 border-[var(--accent)]">
          <p className="text-sm m-0">{invitationMessage}</p>
          <button
            type="button"
            className="btn btn-outline text-xs mt-2"
            onClick={() => setInvitationMessage(null)}
          >
            Kapat
          </button>
        </div>
      )}

      {activeTab === "active" && (
        <>
          <div className="students-toolbar">
            <div className="students-filter-list">
              {statusFilters.map(([k, l, c, tone]) => (
                <button
                  key={k}
                  type="button"
                  className={`student-filter-chip student-filter-${tone}${
                    filter === k ? " active" : ""
                  }`}
                  onClick={() => setFilter(k)}
                >
                  <span className="student-filter-dot" />
                  {l}
                  <span>{c}</span>
                </button>
              ))}
              <button
                type="button"
                className="student-filter-chip student-filter-archived"
                onClick={() => setActiveTab("archived")}
              >
                Geçmiş
                <span>{archived.length}</span>
              </button>
            </div>
            <div className="students-toolbar-tools">
              <label className="students-search">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <input
                  placeholder="Öğrenci ara..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <div className="students-view-toggle" aria-label="Görünüm seçimi">
                <button
                  type="button"
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                  aria-label="Kart görünümü"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                  aria-label="Liste görünümü"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 7h14M5 12h14M5 17h14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className={`students-grid students-grid-${viewMode}`}>
            {list.map((s) => (
              <StudentCard
                key={s.engagementId}
                student={s}
                showStatus
                onDelete={() => handleEnd(s.engagementId, s.name)}
              />
            ))}
            {list.length === 0 && (
              <p className="text-sm text-[var(--muted)]">
                Aktif öğrencin bulunmuyor.
              </p>
            )}
          </div>
        </>
      )}

      {activeTab === "archived" && (
        <div className="students-archive">
          <div className="students-toolbar">
            <div className="students-filter-list">
              <button
                type="button"
                className="student-filter-chip"
                onClick={() => setActiveTab("active")}
              >
                Aktif öğrenciler
                <span>{active.length}</span>
              </button>
              <button type="button" className="student-filter-chip active">
                Geçmiş
                <span>{archived.length}</span>
              </button>
            </div>
          </div>
          {archived.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              Geçmiş öğrencin bulunmuyor.
            </p>
          )}
          {archived.length > 0 && (
            <div className={`students-grid students-grid-${viewMode}`}>
              {archived.map((a) => (
                <article
                  key={a.engagementId}
                  className="student-card student-card-archived"
                >
                  <div className="student-card-menu" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="student-card-head">
                    <UserAvatar name={a.studentName} size={42} />
                    <div className="student-card-title">
                      <h3>{a.studentName}</h3>
                      <p>{a.schoolLevel ?? "Kademe belirtilmedi"}</p>
                    </div>
                  </div>
                  <div className="student-card-metrics">
                    <div>
                      <span>Başlangıç</span>
                      <strong>
                        {new Date(a.startedAt).toLocaleDateString("tr-TR")}
                      </strong>
                    </div>
                    <div>
                      <span>Bitiş</span>
                      <strong>
                        {a.endedAt
                          ? new Date(a.endedAt).toLocaleDateString("tr-TR")
                          : "—"}
                      </strong>
                    </div>
                  </div>
                  {a.endReason && (
                    <p className="student-card-archive-note">
                      Sebep: {a.endReason}
                    </p>
                  )}
                  <span className="status-pill s-archived">
                    <span className="dot-st archived" />
                    Sonlandı
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50 p-4">
          <div className="panel p-6 max-w-md w-full">
            <h2 className="font-bold m-0 mb-4">Öğrenci ekle</h2>
            <p className="text-xs text-[var(--muted)] m-0 mb-4">
              Girilen e-posta sistemde zaten varsa öğrenciye davet gönderilir;
              yoksa yeni hesap açılır ve öğrenciye şifre belirleme bağlantısı
              içeren bir davet e-postası gider.
            </p>
            <form onSubmit={handleAdd}>
              <label className="label">Ad Soyad</label>
              <input name="name" className="input" required />
              <label className="label">E-posta</label>
              <input name="email" type="email" className="input" required />
              <label className="label">Sınıf</label>
              <input name="grade" className="input" placeholder="12. Sınıf" />
              <label className="label">Alan</label>
              <input name="track" className="input" placeholder="Sayısal" />
              <label className="label">Okul kademesi</label>
              <select name="schoolLevel" className="input" defaultValue="">
                <option value="">— Seçiniz —</option>
                <option value="ilkokul">İlkokul</option>
                <option value="ortaokul">Ortaokul</option>
                <option value="lise">Lise</option>
                <option value="universite">Üniversite</option>
                <option value="mezun">Mezun</option>
              </select>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary flex-1 justify-center" disabled={pending}>
                  Davet gönder
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
