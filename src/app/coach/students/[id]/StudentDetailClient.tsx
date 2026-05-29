"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setMotivationAction } from "@/app/actions/notes";
import { endEngagementAction } from "@/app/actions/students";
import type {
  CoachNoteDto,
  ExamResultDto,
  StudentDetailDto,
  WeeklyProgramDto,
} from "@/application/dto";
import { formatTRDate, sortByDateAsc } from "@/lib/dates";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";
import { StudentWeeklyTab } from "./tabs/StudentWeeklyTab";
import { StudentExamsTab } from "./tabs/StudentExamsTab";
import { StudentNotesTab } from "./tabs/StudentNotesTab";
import { StudentLessonNetClient } from "@/app/student/lesson-nets/StudentLessonNetClient";

const TABS = [
  ["overview", "Genel Bakış"],
  ["weekly", "Haftalık Program"],
  ["exams", "Deneme Netleri"],
  ["lesson-nets", "Soru Çözüm"],
  ["notes", "Koç Notları"],
] as const;

type TabKey = (typeof TABS)[number][0];

function formatNet(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatPercent(value: number | null | undefined) {
  return `%${Math.round(value ?? 0)}`;
}

function formatDelta(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const sign = value > 0 ? "+" : "";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${sign}${formatted}`;
}

export function StudentDetailClient({
  student,
  initialTab,
  initialExamRows,
  initialWeeklyWeeks,
  initialWeeklyProgram,
  initialWeeklySelectedWeek,
  initialNotes,
}: {
  student: StudentDetailDto;
  initialTab?: TabKey;
  initialExamRows?: ExamResultDto[];
  initialWeeklyWeeks?: string[];
  initialWeeklyProgram?: WeeklyProgramDto | null;
  initialWeeklySelectedWeek?: string;
  initialNotes?: CoachNoteDto[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = (searchParams.get("tab") as TabKey) ?? "overview";
  const resolvedInitialTab =
    initialTab ??
    (TABS.some(([k]) => k === urlTab) ? urlTab : "overview");
  const [tab, setTab] = useState<TabKey>(resolvedInitialTab);
  const [motivationText, setMotivationText] = useState("");
  const [showMotivation, setShowMotivation] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const title = document.querySelector<HTMLElement>(".topbar-breadcrumb strong");
    if (!title) return;

    const previousTitle = title.textContent;
    title.textContent = student.name;

    return () => {
      if (title.textContent === student.name) {
        title.textContent = previousTitle ?? "";
      }
    };
  }, [student.name]);

  const sendMotivation = () => {
    if (!motivationText.trim()) return;
    startTransition(async () => {
      await setMotivationAction(student.id, motivationText.trim());
      setMotivationText("");
      setShowMotivation(false);
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

  const examRowsAsc = useMemo(
    () => sortByDateAsc(initialExamRows ?? [], (row) => row.date),
    [initialExamRows]
  );
  const latestExam = examRowsAsc.at(-1);
  const bestExamTotal =
    examRowsAsc.length > 0
      ? Math.max(...examRowsAsc.map((row) => row.total))
      : null;
  const averageExamTotal =
    examRowsAsc.length > 0
      ? examRowsAsc.reduce((sum, row) => sum + row.total, 0) / examRowsAsc.length
      : null;
  const previousExam = examRowsAsc.at(-2);
  const latestExamDelta =
    latestExam && previousExam ? latestExam.total - previousExam.total : null;
  const latestNotes = (initialNotes ?? []).slice(0, 3);

  return (
    <div className="screen student-detail-page">
      <div className="student-detail-shell">
        <Link href="/coach/students" className="detail-back-link">
          ← Öğrencilerim
        </Link>

        <section className="student-profile-card">
          <div className="student-profile-main">
            <UserAvatar name={student.name} size={58} />
            <div className="student-profile-copy">
              <div className="student-profile-title-row">
                <h1>{student.name}</h1>
                <span className={`detail-status-pill s-${student.status}`}>
                  {student.statusLabel}
                </span>
              </div>
              {subtitleParts.length > 0 && (
                <p>{subtitleParts.join(" · ")}</p>
              )}
            </div>
          </div>

          <div className="student-profile-actions">
            <Link
              href={`/coach/chat?student=${student.id}`}
              className="detail-action-btn"
            >
              Mesaj
            </Link>
            <button
              type="button"
              className="detail-action-btn"
              disabled={!student.activeEngagementId}
              onClick={() => setShowMotivation((value) => !value)}
            >
              Motivasyon
            </button>
          </div>
        </section>

        {showMotivation && (
          <section className="detail-motivation-card">
            <div>
              <label className="detail-card-title" htmlFor="motivation-message">
                Motivasyon mesajı
              </label>
              <p className="detail-card-subtitle">
                Öğrenci dashboardında görünecek kısa bir mesaj gönder.
              </p>
            </div>
            <textarea
              id="motivation-message"
              className="input min-h-[84px]"
              value={motivationText}
              onChange={(event) => setMotivationText(event.target.value)}
              placeholder="Öğrenci dashboardında görünecek mesaj..."
              disabled={!student.activeEngagementId}
            />
            <div className="detail-motivation-actions">
              <button
                type="button"
                className="detail-action-btn"
                onClick={() => setShowMotivation(false)}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="detail-action-btn primary"
                disabled={pending || !student.activeEngagementId}
                onClick={sendMotivation}
              >
                Gönder
              </button>
            </div>
          </section>
        )}

        <section className="student-detail-stats">
          <article className="detail-stat-card">
            <span className="detail-stat-label">Tamamlama oranı</span>
            <div className="detail-stat-value-row">
              <strong>{formatPercent(student.completionPercent)}</strong>
            </div>
            <span className="detail-stat-foot">genel ilerleme</span>
            <div className="detail-stat-progress">
              <span style={{ width: `${student.completionPercent}%` }} />
            </div>
          </article>
          <article className="detail-stat-card">
            <span className="detail-stat-label">Son TYT neti</span>
            <div className="detail-stat-value-row">
              <strong>{formatNet(latestExam?.total)}</strong>
              {latestExamDelta !== null && (
                <span
                  className={`detail-stat-trend ${
                    latestExamDelta >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatDelta(latestExamDelta)} {latestExamDelta >= 0 ? "↑" : "↓"}
                </span>
              )}
            </div>
            <span className="detail-stat-foot">
              {latestExam ? formatTRDate(latestExam.date) : "veri yok"}
            </span>
          </article>
          <article className="detail-stat-card">
            <span className="detail-stat-label">Deneme</span>
            <div className="detail-stat-value-row">
              <strong>{examRowsAsc.length}</strong>
            </div>
            <span className="detail-stat-foot">son kayıtlar</span>
          </article>
          <article className="detail-stat-card">
            <span className="detail-stat-label">Ortalama net</span>
            <div className="detail-stat-value-row">
              <strong>{formatNet(averageExamTotal)}</strong>
            </div>
            <span className="detail-stat-foot">
              en iyi {formatNet(bestExamTotal)}
            </span>
          </article>
        </section>

        <div className="student-detail-tabs">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={`student-detail-tab${tab === k ? " active" : ""}`}
              onClick={() => setTab(k)}
            >
              {l}
            </button>
          ))}
        </div>

      {tab === "overview" && (
        <StudentOverviewPanel
          student={student}
          latestNotes={latestNotes}
          pending={pending}
          onAddNote={() => setTab("notes")}
          onEndEngagement={endEngagement}
        />
      )}
      {tab === "weekly" && (
        <StudentWeeklyTab
          studentId={student.id}
          role="coach"
          initialWeeks={initialWeeklyWeeks}
          initialProgram={initialWeeklyProgram}
          initialSelectedWeek={initialWeeklySelectedWeek}
          detailVariant
        />
      )}
      {tab === "exams" && (
        <StudentExamsTab
          studentId={student.id}
          initialRows={initialExamRows}
          detailVariant
        />
      )}
      {tab === "lesson-nets" && (
        <StudentLessonNetClient studentId={student.id} readOnly detailVariant />
      )}
      {tab === "notes" && (
        <StudentNotesTab studentId={student.id} initialNotes={initialNotes} />
      )}
      </div>
    </div>
  );
}

function StudentOverviewPanel({
  student,
  latestNotes,
  pending,
  onAddNote,
  onEndEngagement,
}: {
  student: StudentDetailDto;
  latestNotes: CoachNoteDto[];
  pending: boolean;
  onAddNote: () => void;
  onEndEngagement: () => void;
}) {
  return (
    <div className="student-overview-layout">
      <section className="detail-panel coach-notes-overview">
        <div className="detail-card-head compact">
          <div>
            <h2>Koç notları</h2>
            <p>Öğrenciye dair son takip notları</p>
          </div>
          <button
            type="button"
            className="overview-new-note-btn"
            onClick={onAddNote}
          >
            + Yeni not
          </button>
        </div>

        {latestNotes.length === 0 ? (
          <div className="overview-empty-state small">
            Bu öğrenci için henüz not eklenmedi.
          </div>
        ) : (
          <div className="overview-note-grid">
            {latestNotes.map((note) => (
              <article key={note.id} className="overview-note-card">
                <time>
                  {new Date(note.updatedAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                  })}
                </time>
                <p>{note.note}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {student.activeEngagementId ? (
        <section className="detail-relationship-card">
          <div>
            <strong>Koçluk ilişkisi aktif</strong>
            <span>
              İlişki sonlanırsa öğrencinin verisi silinmez; sadece listenizde
              görünmez.
            </span>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={onEndEngagement}
          >
            İlişkiyi sonlandır
          </button>
        </section>
      ) : (
        <section className="detail-relationship-card muted">
          Bu öğrenci ile aktif bir koçluk ilişkin yok. Yeni veri ekleyemezsin.
        </section>
      )}
    </div>
  );
}
