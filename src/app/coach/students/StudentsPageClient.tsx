"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StudentCard } from "@/presentation/components/students/StudentCard";
import {
  inviteStudentAction,
  endEngagementAction,
} from "@/app/actions/students";
import { Icons } from "@/presentation/components/icons";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import type { ArchivedStudentRowDto } from "@/application/use-cases/ListArchivedStudentsForCoachUseCase";

type Tab = "active" | "archived";

export function StudentsPageClient({
  initialActive,
  initialArchived,
}: {
  initialActive: CoachStudentRowDto[];
  initialArchived: ArchivedStudentRowDto[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [active, setActive] = useState(initialActive);
  const [archived, setArchived] = useState(initialArchived);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState<string | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  useEffect(() => {
    setArchived(initialArchived);
  }, [initialArchived]);

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
        router.refresh();
      } catch (err) {
        alert(
          err instanceof Error ? err.message : "İlişki sonlandırılamadı."
        );
      }
    });
  };

  return (
    <div className="screen">
      <div className="page-head">
        <div className="page-title">
          <h1>Öğrencilerim</h1>
          <p>
            {active.length} aktif öğrenci · {counts.red ?? 0} riskli
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icons.Plus /> Öğrenci Ekle
        </button>
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

      <div className="tab-bar mb-4">
        <button
          type="button"
          className={`tab-btn${activeTab === "active" ? " active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Aktif öğrenciler ({active.length})
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === "archived" ? " active" : ""}`}
          onClick={() => setActiveTab("archived")}
        >
          Geçmiş öğrenciler ({archived.length})
        </button>
      </div>

      {activeTab === "active" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            {(
              [
                ["all", "Tümü", active.length],
                ["green", "İyi", counts.green ?? 0],
                ["yellow", "Ortalama", counts.yellow ?? 0],
                ["red", "Riskli", counts.red ?? 0],
              ] as [string, string, number][]
            ).map(([k, l, c]) => (
              <button
                key={k}
                type="button"
                className={`filter-tab${filter === k ? " active" : ""}`}
                onClick={() => setFilter(k)}
              >
                {l} <span className="opacity-60">{c}</span>
              </button>
            ))}
            <input
              className="input mb-0 max-w-xs ml-auto"
              placeholder="Öğrenci ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="students-grid">
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
        <div className="space-y-3">
          {archived.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              Geçmiş öğrencin bulunmuyor.
            </p>
          )}
          {archived.map((a) => (
            <div key={a.engagementId} className="panel p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-semibold m-0">{a.studentName}</p>
                  <p className="text-xs text-[var(--muted)] m-0 mt-1">
                    {a.schoolLevel ?? "—"} ·{" "}
                    {new Date(a.startedAt).toLocaleDateString("tr-TR")} →{" "}
                    {a.endedAt
                      ? new Date(a.endedAt).toLocaleDateString("tr-TR")
                      : "—"}
                  </p>
                  {a.endReason && (
                    <p className="text-xs text-[var(--muted)] m-0 mt-1">
                      Sebep: {a.endReason}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--muted)]">
                  Sonlandı
                </span>
              </div>
            </div>
          ))}
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
