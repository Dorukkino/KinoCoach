"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setMotivationAction } from "@/app/actions/notes";
import { endEngagementAction } from "@/app/actions/students";
import { StudentDetailDto } from "@/application/dto";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";
import { StudentWeeklyTab } from "./tabs/StudentWeeklyTab";
import { StudentExamsTab } from "./tabs/StudentExamsTab";
import { StudentNotesTab } from "./tabs/StudentNotesTab";
import { StudentLessonNetClient } from "@/app/student/lesson-nets/StudentLessonNetClient";
import { RealtimeRouteRefresh } from "@/presentation/components/realtime/RealtimeRouteRefresh";

const TABS = [
  ["overview", "Genel Bakış"],
  ["weekly", "Haftalık Program"],
  ["exams", "Deneme Netleri"],
  ["lesson-nets", "Soru Çözüm"],
  ["notes", "Koç Notları"],
] as const;

type TabKey = (typeof TABS)[number][0];

export function StudentDetailClient({ student }: { student: StudentDetailDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) ?? "overview";
  const [tab, setTab] = useState<TabKey>(
    TABS.some(([k]) => k === initialTab) ? initialTab : "overview"
  );
  const [motivationText, setMotivationText] = useState("");
  const [pending, startTransition] = useTransition();

  const sendMotivation = () => {
    if (!motivationText.trim()) return;
    startTransition(async () => {
      await setMotivationAction(student.id, motivationText.trim());
      setMotivationText("");
      alert("Motivasyon mesajı gönderildi");
    });
  };

  const endEngagement = () => {
    if (!student.activeEngagementId) return;
    const reason = window.prompt(
      `"${student.name}" ile koçluk ilişkisini sonlandırıyorsun.\n\nİstersen kısa bir sebep yazabilirsin (opsiyonel):`,
      ""
    );
    if (reason === null) return;
    startTransition(async () => {
      try {
        await endEngagementAction(
          student.activeEngagementId as string,
          reason.trim() || undefined
        );
        router.push("/coach/students");
      } catch (err) {
        alert(
          err instanceof Error ? err.message : "İlişki sonlandırılamadı."
        );
      }
    });
  };

  const subtitleParts = [
    student.grade,
    student.track,
    !student.email?.includes("@placeholder.local") ? student.email : null,
  ].filter(Boolean) as string[];

  return (
    <div className="screen">
      <RealtimeRouteRefresh
        channelPrefix={`coach-student-detail-${student.id}`}
        tables={[
          "weekly_programs",
          "exam_results",
          "question_sessions",
          "coach_notes",
          "motivation_messages",
          "students",
          "coaching_engagements",
        ]}
      />
      <Link href="/coach/students" className="text-sm text-[var(--muted)] mb-4 inline-block">
        ← Öğrencilerim
      </Link>
      <header className="flex flex-wrap gap-4 items-start mb-6">
        <UserAvatar name={student.name} size={72} />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold m-0">{student.name}</h1>
            <span className={`status-pill s-${student.status}`}>
              {student.statusLabel}
            </span>
          </div>
          {subtitleParts.length > 0 && (
            <p className="text-sm text-[var(--muted)] mt-1">
              {subtitleParts.join(" · ")}
            </p>
          )}
        </div>
      </header>
      <div className="stats-row mb-6">
        <div className="stat-card">
          <span className="text-xs text-[var(--muted)]">Tamamlama</span>
          <div className="text-2xl font-bold">%{student.completionPercent}</div>
        </div>
      </div>
      <div className="tab-bar">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={`tab-btn${tab === k ? " active" : ""}`}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="panel p-6 space-y-4">
          <p className="text-sm text-[var(--muted)] m-0">
            Son aktif: {student.lastActive ?? "—"}
          </p>
          {!student.activeEngagementId && (
            <p className="text-sm text-[var(--muted)] m-0">
              Bu öğrenci ile aktif bir koçluk ilişkin yok. Yeni veri ekleyemezsin.
            </p>
          )}
          <div>
            <label className="label">Motivasyon mesajı</label>
            <textarea
              className="input min-h-[80px]"
              value={motivationText}
              onChange={(e) => setMotivationText(e.target.value)}
              placeholder="Öğrenci dashboardında görünecek mesaj…"
              disabled={!student.activeEngagementId}
            />
            <button
              type="button"
              className="btn btn-primary mt-2"
              disabled={pending || !student.activeEngagementId}
              onClick={sendMotivation}
            >
              Motivasyon gönder
            </button>
          </div>
          {student.activeEngagementId && (
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm font-semibold m-0 mb-2">
                Koçluk ilişkisini sonlandır
              </p>
              <p className="text-xs text-[var(--muted)] m-0 mb-3">
                İlişki sonlanırsa öğrencinin verisi silinmez; sadece artık senin
                listenizde görünmez ve öğrenci yeni bir koçtan davet alabilir.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                disabled={pending}
                onClick={endEngagement}
                style={{ borderColor: "var(--risk)", color: "var(--risk)" }}
              >
                İlişkiyi sonlandır
              </button>
            </div>
          )}
        </div>
      )}
      {tab === "weekly" && <StudentWeeklyTab studentId={student.id} role="coach" />}
      {tab === "exams" && <StudentExamsTab studentId={student.id} />}
      {tab === "lesson-nets" && <StudentLessonNetClient studentId={student.id} readOnly />}
      {tab === "notes" && <StudentNotesTab studentId={student.id} />}
    </div>
  );
}
