"use client";

import { useCallback, useEffect, useRef, useState, useTransition, useMemo } from "react";
import {
  listQuestionSessionsAction,
  listQuestionSessionWeeksAction,
  createQuestionSessionAction,
  deleteQuestionSessionAction,
  QuestionSessionDto,
} from "@/app/actions/question-sessions";
import {
  getCoachLessonsAction,
  addCoachLessonAction,
  deleteCoachLessonAction,
  CoachLesson,
} from "@/app/actions/coach-lessons";
import {
  todayLocalISO,
  getWeekStartISO,
  getWeekStartForISO,
  mergeWeeksNearToday,
  sortByDateNearToday,
} from "@/lib/dates";
import { WeekPicker } from "@/presentation/components/weekly/WeekPicker";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

const today = () => todayLocalISO();

interface FormState {
  lessonName: string;
  date: string;
  total: string;
  correct: string;
  wrong: string;
  blank: string;
  note: string;
}

const emptyForm = (): FormState => ({
  lessonName: "",
  date: today(),
  total: "",
  correct: "",
  wrong: "",
  blank: "",
  note: "",
});

type View = "list" | "add-session" | "add-lesson";

type SessionTotals = {
  total: number;
  correct: number;
  wrong: number;
  blank: number;
};

interface StudentLessonNetClientProps {
  studentId: string;
  readOnly?: boolean;
  detailVariant?: boolean;
  initialSessions?: QuestionSessionDto[];
  initialWeeks?: string[];
  initialSelectedWeek?: string;
}

const calculateNet = (correct: number, wrong: number) => correct - wrong / 4;

const formatNet = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

const emptyTotals = (): SessionTotals => ({
  total: 0,
  correct: 0,
  wrong: 0,
  blank: 0,
});

const addToTotals = (target: SessionTotals, session: QuestionSessionDto) => {
  target.total += session.total;
  target.correct += session.correct;
  target.wrong += session.wrong;
  target.blank += session.blank;
};

const formatDateISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekDays = (weekStart: string) => {
  const [year, month, day] = weekStart.split("-").map(Number);
  const start = new Date(year, month - 1, day);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: formatDateISO(date),
      label: [
        "Pazartesi",
        "Salı",
        "Çarşamba",
        "Perşembe",
        "Cuma",
        "Cumartesi",
        "Pazar",
      ][index],
    };
  });
};

export function StudentLessonNetClient({
  studentId,
  readOnly = false,
  detailVariant = false,
  initialSessions,
  initialWeeks,
  initialSelectedWeek,
}: StudentLessonNetClientProps) {
  const currentWeek = useMemo(() => getWeekStartISO(), []);
  const hasInitialData = initialSessions !== undefined && initialWeeks !== undefined;
  const skipInitialSessionsFetch = useRef(hasInitialData);
  const [selectedWeek, setSelectedWeek] = useState<string>(
    initialSelectedWeek ?? currentWeek
  );
  const [weeks, setWeeks] = useState<string[]>(initialWeeks ?? [currentWeek]);
  const [sessions, setSessions] = useState<QuestionSessionDto[]>(
    initialSessions ?? []
  );
  const [sessionsLoading, setSessionsLoading] = useState(
    initialSessions === undefined
  );
  const [lessons, setLessons] = useState<CoachLesson[]>([]);
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [newLessonName, setNewLessonName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const lessonInputRef = useRef<HTMLInputElement>(null);

  const isPastWeek = selectedWeek < currentWeek;
  const effectiveReadOnly = readOnly || isPastWeek;

  const loadSessions = useCallback((week: string, showLoading = false) => {
    if (showLoading) setSessionsLoading(true);
    startTransition(async () => {
      try {
        setSessions(await listQuestionSessionsAction(studentId, week));
      } finally {
        setSessionsLoading(false);
      }
    });
  }, [studentId, startTransition]);

  const loadLessons = useCallback(async () => {
    const data = await getCoachLessonsAction();
    setLessons(data);
  }, []);

  const loadWeeks = useCallback(async () => {
    const dbWeeks = await listQuestionSessionWeeksAction(studentId);
    setWeeks(mergeWeeksNearToday(currentWeek, dbWeeks));
  }, [currentWeek, studentId]);

  useEffect(() => {
    if (!hasInitialData) void loadWeeks();
    if (!readOnly) void loadLessons();
  }, [hasInitialData, loadLessons, loadWeeks, readOnly]);

  useEffect(() => {
    if (skipInitialSessionsFetch.current) {
      skipInitialSessionsFetch.current = false;
      return;
    }
    loadSessions(selectedWeek, true);
    setView("list");
    setError("");
  }, [loadSessions, selectedWeek]);

  const refreshQuestionSessions = useCallback(() => {
    void loadWeeks();
    loadSessions(selectedWeek, false);
  }, [loadSessions, loadWeeks, selectedWeek]);

  useSupabaseTableRealtime({
    channelName: `question-sessions-${studentId}`,
    table: "question_sessions",
    filter: `student_id=eq.${studentId}`,
    debounceMs: 500,
    onChange: refreshQuestionSessions,
  });

  useSupabaseTableRealtime({
    channelName: "coach-lessons",
    table: "coach_lessons",
    enabled: !readOnly,
    debounceMs: 500,
    onChange: loadLessons,
  });

  useEffect(() => {
    if (view === "add-lesson") {
      setTimeout(() => lessonInputRef.current?.focus(), 50);
    }
  }, [view]);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const autoTotal = (f: FormState) => {
    const c = parseInt(f.correct) || 0;
    const w = parseInt(f.wrong) || 0;
    const b = parseInt(f.blank) || 0;
    return c + w + b;
  };

  const handleDeleteLesson = async (lesson: CoachLesson) => {
    if (effectiveReadOnly) return;
    setDeletingId(lesson.id);
    try {
      await deleteCoachLessonAction(lesson.id);
      // Silme başarılı — DB'den taze listeyi çek
      const fresh = await getCoachLessonsAction();
      setLessons(fresh);
      if (form.lessonName === lesson.name) {
        setForm((prev) => ({ ...prev, lessonName: "" }));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ders silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddLesson = async () => {
    if (effectiveReadOnly) return;
    const name = newLessonName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const lesson = await addCoachLessonAction(name);
      const fresh = await getCoachLessonsAction();
      setLessons(fresh);
      setForm((prev) => ({ ...prev, lessonName: lesson.name }));
      setNewLessonName("");
      setView("add-session");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (effectiveReadOnly) return;
    if (!form.lessonName) { setError("Ders seçiniz."); return; }
    if (!form.date) { setError("Tarih giriniz."); return; }
    const correct = parseInt(form.correct);
    const wrong   = parseInt(form.wrong);
    const blank   = parseInt(form.blank);
    if ([correct, wrong, blank].some(isNaN)) {
      setError("Doğru, yanlış ve boş alanlarını doldurunuz.");
      return;
    }
    const total = correct + wrong + blank;
    setSaving(true);
    setError("");
    try {
      const savedDate = form.date;
      const result = await createQuestionSessionAction({
        studentId,
        lessonName: form.lessonName,
        date: savedDate,
        total,
        correct,
        wrong,
        blank,
        note: form.note.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setForm(emptyForm());
      setView("list");
      const savedWeek = getWeekStartForISO(savedDate);
      await loadWeeks();
      setSelectedWeek(savedWeek);
      loadSessions(savedWeek, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (effectiveReadOnly) return;
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) return;
    startTransition(async () => {
      await deleteQuestionSessionAction(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    });
  };

  // Ders bazlı özet
  const summary = sessions.reduce<Record<string, { total: number; correct: number; wrong: number; blank: number }>>(
    (acc, s) => {
      if (!acc[s.lessonName]) acc[s.lessonName] = { total: 0, correct: 0, wrong: 0, blank: 0 };
      acc[s.lessonName].total   += s.total;
      acc[s.lessonName].correct += s.correct;
      acc[s.lessonName].wrong   += s.wrong;
      acc[s.lessonName].blank   += s.blank;
      return acc;
    },
    {}
  );

  const sortedSessions = useMemo(
    () => sortByDateNearToday(sessions, (s) => s.date),
    [sessions]
  );

  const detailTotals = useMemo(
    () =>
      sessions.reduce<SessionTotals>((acc, session) => {
        addToTotals(acc, session);
        return acc;
      }, emptyTotals()),
    [sessions]
  );

  const detailWeekDays = useMemo(() => getWeekDays(selectedWeek), [selectedWeek]);

  const detailRows = useMemo(() => {
    const rows = new Map<
      string,
      {
        lessonName: string;
        totals: SessionTotals;
        days: Record<string, SessionTotals>;
      }
    >();

    sessions.forEach((session) => {
      const row =
        rows.get(session.lessonName) ??
        {
          lessonName: session.lessonName,
          totals: emptyTotals(),
          days: {},
        };

      addToTotals(row.totals, session);
      row.days[session.date] = row.days[session.date] ?? emptyTotals();
      addToTotals(row.days[session.date], session);
      rows.set(session.lessonName, row);
    });

    return Array.from(rows.values()).sort((a, b) => {
      if (b.totals.total !== a.totals.total) return b.totals.total - a.totals.total;
      return a.lessonName.localeCompare(b.lessonName, "tr");
    });
  }, [sessions]);

  if (detailVariant && view === "list") {
    const totalNet = calculateNet(detailTotals.correct, detailTotals.wrong);

    return (
      <div className="coach-question-detail">
        <div className="coach-question-toolbar">
          <WeekPicker
            weeks={weeks}
            selectedWeek={selectedWeek}
            currentWeek={currentWeek}
            onSelect={setSelectedWeek}
          />
          {isPastWeek && (
            <span className="coach-question-readonly-note">
              Geçmiş hafta - yalnızca görüntüleme
            </span>
          )}
        </div>

        {!sessionsLoading && (
          <section className="coach-question-stat-grid" aria-label="Soru çözüm özeti">
            <article className="coach-question-stat-card">
              <span>Toplam Soru</span>
              <strong>{detailTotals.total}</strong>
            </article>
            <article className="coach-question-stat-card">
              <span>Doğru</span>
              <strong>{detailTotals.correct}</strong>
              <small className="s-good">isabet</small>
            </article>
            <article className="coach-question-stat-card">
              <span>Yanlış</span>
              <strong>{detailTotals.wrong}</strong>
              <small className="s-risk">hata</small>
            </article>
            <article className="coach-question-stat-card">
              <span>Boş</span>
              <strong>{detailTotals.blank}</strong>
              <small>işaretlenmedi</small>
            </article>
            <article className="coach-question-stat-card net">
              <span>Net</span>
              <strong>{formatNet(totalNet)}</strong>
              <small>başarı neti</small>
            </article>
          </section>
        )}

        {sessionsLoading ? (
          <LoadingScreen className="coach-question-panel" />
        ) : detailRows.length === 0 ? (
          <div className="coach-question-empty">
            Bu hafta için soru çözüm kaydı yok.
          </div>
        ) : (
          <section className="coach-question-panel">
            <div className="coach-question-panel-head">
              <div>
                <h2>Bu haftaki soru çözümleri</h2>
                <p>Günlük ders bazlı doğru, yanlış ve boş dağılımı</p>
              </div>
              <div className="coach-question-legend">
                <span className="s-good">Doğru</span>
                <span className="s-risk">Yanlış</span>
                <span className="s-empty">Boş</span>
              </div>
            </div>

            <div className="coach-question-table-wrap">
              <table className="coach-question-table">
                <thead>
                  <tr>
                    <th>Ders</th>
                    {detailWeekDays.map((day) => (
                      <th key={day.date}>{day.label}</th>
                    ))}
                    <th className="total-head">Top.</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row) => (
                    <tr key={row.lessonName}>
                      <th scope="row">{row.lessonName}</th>
                      {detailWeekDays.map((day) => {
                        const cell = row.days[day.date];
                        const accuracy = cell?.total
                          ? cell.correct / cell.total
                          : 0;
                        const tone =
                          !cell || cell.total === 0
                            ? "empty"
                            : accuracy >= 0.72
                              ? "good"
                              : accuracy >= 0.5
                                ? "warn"
                                : "risk";

                        return (
                          <td key={day.date} className={`tone-${tone}`}>
                            {cell && cell.total > 0 ? (
                              <div className="coach-question-cell">
                                <span className="s-good">{cell.correct}</span>
                                <span className="s-risk">{cell.wrong}</span>
                                <span className="s-empty">{cell.blank}</span>
                              </div>
                            ) : (
                              <span className="coach-question-dash">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="coach-question-row-total">
                        <strong>{row.totals.total}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* ── HAFTA SEÇİCİ + EKLE BUTONU ── */}
      {view === "list" && (
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <WeekPicker
              weeks={weeks}
              selectedWeek={selectedWeek}
              currentWeek={currentWeek}
              onSelect={setSelectedWeek}
            />
            {isPastWeek && (
              <span className="text-xs text-[var(--muted)] italic">
                Geçmiş hafta — yalnızca görüntüleme
              </span>
            )}
          </div>
          {!effectiveReadOnly && (
            <button
              className="btn btn-primary"
              onClick={() => { setView("add-session"); setError(""); }}
            >
              + Soru Çözümü Ekle
            </button>
          )}
        </div>
      )}

      {/* ── FORM: YENİ SORU ÇÖZÜMÜ ── */}
      {view === "add-session" && !effectiveReadOnly && (
        <div className="panel p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontWeight: 700, fontSize: 15 }}>Yeni Soru Çözümü</span>
            <button
              onClick={() => { setView("list"); setError(""); }}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--bg)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "var(--muted)",
              }}
            >×</button>
          </div>

          {/* Ders seç */}
          <label className="label">Ders</label>
          <button
            className="btn btn-outline"
            style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
            onClick={() => { setView("add-lesson"); setError(""); }}
          >
            <span style={{ fontSize: 18, lineHeight: 1, marginRight: 4 }}>+</span>
            Ders Ekle
          </button>

          {lessons.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {lessons.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    border: form.lessonName === l.name
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                    background: form.lessonName === l.name
                      ? "var(--accent-soft)"
                      : "var(--bg-elev)",
                    overflow: "hidden",
                  }}
                >
                  {/* Ders seçme alanı */}
                  <button
                    onClick={() => set("lessonName", l.name)}
                    style={{
                      padding: "6px 10px 6px 14px",
                      background: "transparent",
                      border: "none",
                      color: form.lessonName === l.name ? "var(--accent-ink)" : "var(--ink)",
                      fontWeight: form.lessonName === l.name ? 600 : 400,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {l.name}
                  </button>
                  {/* × silme butonu */}
                  <button
                    onClick={() => handleDeleteLesson(l)}
                    disabled={deletingId === l.id}
                    title="Dersi sil"
                    style={{
                      padding: "4px 8px 4px 4px",
                      background: "transparent",
                      border: "none",
                      color: "var(--muted)",
                      fontSize: 15,
                      lineHeight: 1,
                      cursor: deletingId === l.id ? "not-allowed" : "pointer",
                      opacity: deletingId === l.id ? 0.4 : 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tarih */}
          <label className="label">Tarih</label>
          <input
            type="date"
            className="input"
            value={form.date}
            max={today()}
            onChange={(e) => set("date", e.target.value)}
          />

          {/* Doğru / Yanlış / Boş */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
            <div>
              <label className="label">Doğru</label>
              <input
                type="number" min="0" className="input" placeholder="0"
                value={form.correct}
                onChange={(e) => set("correct", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Yanlış</label>
              <input
                type="number" min="0" className="input" placeholder="0"
                value={form.wrong}
                onChange={(e) => set("wrong", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Boş</label>
              <input
                type="number" min="0" className="input" placeholder="0"
                value={form.blank}
                onChange={(e) => set("blank", e.target.value)}
              />
            </div>
          </div>

          {/* Toplam önizleme */}
          {(form.correct || form.wrong || form.blank) && (
            <div style={{
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)", color: "var(--accent-ink)",
              fontSize: 13, fontWeight: 600, marginBottom: 4,
            }}>
              Toplam Soru: {autoTotal(form)}
            </div>
          )}

          {/* Konu notu */}
          <label className="label" style={{ marginTop: 10 }}>Konu Notu <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>(isteğe bağlı)</span></label>
          <textarea
            className="input"
            rows={2}
            placeholder="Örn: Paragraf soruları, Türev uygulamaları…"
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            style={{ resize: "vertical", minHeight: 60 }}
          />

          {error && <p style={{ color: "var(--risk)", fontSize: 13, marginTop: 6 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => { setView("list"); setError(""); }}>İptal</button>
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={handleSubmit}
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* ── FORM: YENİ DERS EKLE ── */}
      {view === "add-lesson" && !effectiveReadOnly && (
        <div className="panel p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontWeight: 700, fontSize: 15 }}>Yeni Ders Ekle</span>
            <button
              onClick={() => setView("add-session")}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--bg)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "var(--muted)",
              }}
            >×</button>
          </div>
          <label className="label">Ders Adı</label>
          <input
            ref={lessonInputRef}
            className="input"
            value={newLessonName}
            onChange={(e) => setNewLessonName(e.target.value)}
            placeholder="Matematik, Türkçe, Fizik…"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddLesson();
              if (e.key === "Escape") setView("add-session");
            }}
          />
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
            Eklenen ders tüm soru çözüm kayıtlarında kullanılabilir.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-outline" onClick={() => setView("add-session")}>Geri</button>
            <button
              className="btn btn-primary"
              disabled={!newLessonName.trim() || saving}
              onClick={handleAddLesson}
              style={{ opacity: newLessonName.trim() && !saving ? 1 : 0.5 }}
            >
              {saving ? "Ekleniyor…" : "Ekle"}
            </button>
          </div>
        </div>
      )}

      {/* ── ÖZET KARTLARI ── */}
      {!sessionsLoading && sessions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {Object.entries(summary).map(([lesson, s]) => (
            <div key={lesson} className="panel" style={{ padding: "14px 18px", minWidth: 160 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{lesson}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 2 }}>
                <span>Toplam: <strong style={{ color: "var(--ink)" }}>{s.total}</strong></span>
                <span>Net: <strong style={{ color: "var(--accent-ink)" }}>{formatNet(calculateNet(s.correct, s.wrong))}</strong></span>
                <span style={{ color: "var(--good-ink)" }}>Doğru: <strong>{s.correct}</strong></span>
                <span style={{ color: "var(--risk-ink)" }}>Yanlış: <strong>{s.wrong}</strong></span>
                <span>Boş: <strong style={{ color: "var(--ink)" }}>{s.blank}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KAYIT LİSTESİ ── */}
      {sessionsLoading && view === "list" ? (
        <LoadingScreen className="panel" />
      ) : sortedSessions.length === 0 && view === "list" ? (
        <div className="panel p-8 text-center text-sm text-[var(--muted)]">
          {effectiveReadOnly
            ? "Bu hafta için soru çözüm kaydı yok."
            : "Bu hafta henüz soru çözüm kaydı eklemediniz. Yukarıdaki butondan ekleyebilirsiniz."}
        </div>
      ) : sortedSessions.length > 0 ? (
        <div className="panel overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] bg-[var(--bg-elev)]">
                <th className="p-3">Tarih</th>
                <th className="p-3">Ders</th>
                <th className="p-3">Toplam</th>
                <th className="p-3" style={{ color: "var(--good-ink)" }}>Doğru</th>
                <th className="p-3" style={{ color: "var(--risk-ink)" }}>Yanlış</th>
                <th className="p-3">Boş</th>
                <th className="p-3 font-bold">Net</th>
                <th className="p-3">Not</th>
                {!effectiveReadOnly && <th className="p-3"></th>}
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((s) => (
                <tr key={s.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-elev)]">
                  <td className="p-3">{s.date}</td>
                  <td className="p-3 font-medium">{s.lessonName}</td>
                  <td className="p-3">{s.total}</td>
                  <td className="p-3" style={{ color: "var(--good-ink)", fontWeight: 600 }}>{s.correct}</td>
                  <td className="p-3" style={{ color: "var(--risk-ink)", fontWeight: 600 }}>{s.wrong}</td>
                  <td className="p-3">{s.blank}</td>
                  <td className="p-3 font-semibold">{formatNet(calculateNet(s.correct, s.wrong))}</td>
                  <td className="p-3 text-[var(--muted)] max-w-[180px]">
                    {s.note ? (
                      <span className="text-xs leading-snug block truncate" title={s.note}>{s.note}</span>
                    ) : (
                      <span className="text-xs text-[var(--muted-2)]">—</span>
                    )}
                  </td>
                  {!effectiveReadOnly && (
                    <td className="p-3">
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        style={{ color: "var(--muted-2)", fontSize: 16, lineHeight: 1 }}
                        title="Sil"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
