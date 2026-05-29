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

type WeeklyCell = {
  correct: string;
  wrong: string;
  blank: string;
};

type WeeklyCellMap = Record<string, Record<string, WeeklyCell>>;

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

const DEFAULT_LESSON_NAMES = [
  "Matematik",
  "Türkçe",
  "Geometri",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "Edebiyat",
];

const emptyWeeklyCell = (): WeeklyCell => ({
  correct: "",
  wrong: "",
  blank: "",
});

const numberToCellValue = (value: number) => (value > 0 ? String(value) : "");

const parseCellNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};

const sumWeeklyCell = (cell?: WeeklyCell): SessionTotals => ({
  correct: parseCellNumber(cell?.correct ?? ""),
  wrong: parseCellNumber(cell?.wrong ?? ""),
  blank: parseCellNumber(cell?.blank ?? ""),
  total:
    parseCellNumber(cell?.correct ?? "") +
    parseCellNumber(cell?.wrong ?? "") +
    parseCellNumber(cell?.blank ?? ""),
});

const getCellTone = (cell?: WeeklyCell) => {
  const totals = sumWeeklyCell(cell);
  if (totals.total === 0) return "";
  const accuracy = totals.correct / totals.total;
  if (accuracy >= 0.72) return "good";
  if (accuracy >= 0.5) return "warn";
  return "risk";
};

const serializeWeeklyCells = (
  lessonNames: string[],
  weekDays: ReturnType<typeof getWeekDays>,
  cells: WeeklyCellMap
) =>
  lessonNames
    .flatMap((lessonName) =>
      weekDays.map((day) => {
        const totals = sumWeeklyCell(cells[lessonName]?.[day.date]);
        return `${lessonName}|${day.date}|${totals.correct}|${totals.wrong}|${totals.blank}`;
      })
    )
    .join(";");

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
  const [weekSaving, setWeekSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [weeklyCells, setWeeklyCells] = useState<WeeklyCellMap>({});
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

  const handleCellChange = (
    lessonName: string,
    date: string,
    field: keyof WeeklyCell,
    value: string
  ) => {
    if (effectiveReadOnly || date > today()) return;
    const normalized = value.replace(/[^\d]/g, "");
    setSaveMessage("");
    setWeeklyCells((prev) => ({
      ...prev,
      [lessonName]: {
        ...(prev[lessonName] ?? {}),
        [date]: {
          ...(prev[lessonName]?.[date] ?? emptyWeeklyCell()),
          [field]: normalized,
        },
      },
    }));
  };

  const handleSaveWeek = async () => {
    if (effectiveReadOnly || weekSaving) return;

    setWeekSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const persistedCells: WeeklyCellMap = {};

      sessions.forEach((session) => {
        persistedCells[session.lessonName] = persistedCells[session.lessonName] ?? {};
        const current = sumWeeklyCell(persistedCells[session.lessonName][session.date]);
        persistedCells[session.lessonName][session.date] = {
          correct: numberToCellValue(current.correct + session.correct),
          wrong: numberToCellValue(current.wrong + session.wrong),
          blank: numberToCellValue(current.blank + session.blank),
        };
      });

      if (
        serializeWeeklyCells(lessonNames, detailWeekDays, persistedCells) ===
        serializeWeeklyCells(lessonNames, detailWeekDays, weeklyCells)
      ) {
        setSaveMessage("Kaydedilecek değişiklik yok.");
        return;
      }

      for (const session of sessions) {
        await deleteQuestionSessionAction(session.id);
      }

      for (const lessonName of lessonNames) {
        for (const day of detailWeekDays) {
          if (day.date > today()) continue;
          const cellTotals = sumWeeklyCell(weeklyCells[lessonName]?.[day.date]);
          if (cellTotals.total === 0) continue;

          const result = await createQuestionSessionAction({
            studentId,
            lessonName,
            date: day.date,
            total: cellTotals.total,
            correct: cellTotals.correct,
            wrong: cellTotals.wrong,
            blank: cellTotals.blank,
            note: "",
          });

          if (!result.ok) {
            throw new Error(result.error);
          }
        }
      }

      const freshSessions = await listQuestionSessionsAction(studentId, selectedWeek);
      setSessions(freshSessions);
      await loadWeeks();
      setSaveMessage("Hafta kaydedildi.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hafta kaydedilemedi.");
    } finally {
      setWeekSaving(false);
    }
  };

  const detailTotals = useMemo(
    () =>
      sessions.reduce<SessionTotals>((acc, session) => {
        addToTotals(acc, session);
        return acc;
      }, emptyTotals()),
    [sessions]
  );

  const detailWeekDays = useMemo(() => getWeekDays(selectedWeek), [selectedWeek]);

  const lessonNames = useMemo(() => {
    const names = new Set(DEFAULT_LESSON_NAMES);
    lessons.forEach((lesson) => names.add(lesson.name));
    sessions.forEach((session) => names.add(session.lessonName));
    return Array.from(names);
  }, [lessons, sessions]);

  useEffect(() => {
    const next: WeeklyCellMap = {};

    sessions.forEach((session) => {
      next[session.lessonName] = next[session.lessonName] ?? {};
      const current = sumWeeklyCell(next[session.lessonName][session.date]);
      next[session.lessonName][session.date] = {
        correct: numberToCellValue(current.correct + session.correct),
        wrong: numberToCellValue(current.wrong + session.wrong),
        blank: numberToCellValue(current.blank + session.blank),
      };
    });

    setWeeklyCells(next);
  }, [sessions]);

  const weeklyTotals = useMemo(
    () =>
      lessonNames.reduce<SessionTotals>((acc, lessonName) => {
        detailWeekDays.forEach((day) => {
          const cellTotals = sumWeeklyCell(weeklyCells[lessonName]?.[day.date]);
          acc.correct += cellTotals.correct;
          acc.wrong += cellTotals.wrong;
          acc.blank += cellTotals.blank;
          acc.total += cellTotals.total;
        });
        return acc;
      }, emptyTotals()),
    [detailWeekDays, lessonNames, weeklyCells]
  );

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

  const totalNet = calculateNet(weeklyTotals.correct, weeklyTotals.wrong);
  const successRate = weeklyTotals.total
    ? Math.round((weeklyTotals.correct / weeklyTotals.total) * 100)
    : 0;

  return (
    <div>
      {/* ── BAŞLIK + HAFTA KAYDET ── */}
      {view === "list" && (
        <div className="page-head student-question-head">
          <div className="page-title">
            <h1>Soru Çözüm Listem</h1>
            <p>Her ders için günlük çözdüğün soruları Doğru / Yanlış / Boş olarak gir</p>
          </div>
          <div className="student-question-actions">
            <WeekPicker
              weeks={weeks}
              selectedWeek={selectedWeek}
              currentWeek={currentWeek}
              onSelect={setSelectedWeek}
            />
            {isPastWeek && (
              <span className="student-question-readonly">
                Geçmiş hafta — yalnızca görüntüleme
              </span>
            )}
            {!effectiveReadOnly && (
              <button
                className="btn btn-primary student-question-save"
                disabled={weekSaving}
                onClick={handleSaveWeek}
              >
                {weekSaving ? "Kaydediliyor..." : "Haftayı Kaydet"}
              </button>
            )}
          </div>
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

      {view === "list" && (
        sessionsLoading ? (
          <LoadingScreen className="panel" />
        ) : (
          <div className="student-question-list">
            <section className="qz-summary" aria-label="Soru çözüm özeti">
              <article className="qz-sum-card">
                <span className="qz-sum-l">Toplam Soru</span>
                <span className="qz-sum-v">{weeklyTotals.total}</span>
              </article>
              <article className="qz-sum-card">
                <span className="qz-sum-l"><span className="qz-dot d" /> Doğru</span>
                <span className="qz-sum-v">{weeklyTotals.correct}</span>
              </article>
              <article className="qz-sum-card">
                <span className="qz-sum-l"><span className="qz-dot y" /> Yanlış</span>
                <span className="qz-sum-v">{weeklyTotals.wrong}</span>
              </article>
              <article className="qz-sum-card">
                <span className="qz-sum-l"><span className="qz-dot b" /> Boş</span>
                <span className="qz-sum-v">{weeklyTotals.blank}</span>
              </article>
              <article className="qz-sum-card accent">
                <span className="qz-sum-l">Net</span>
                <span className="qz-sum-v">{formatNet(totalNet)}</span>
                <span className="qz-sum-sub">başarı %{successRate}</span>
              </article>
            </section>

            <section className="panel qz-panel">
              <header className="panel-head qz-panel-head">
                <div className="panel-title">
                  <h3>Bu haftaki soru çözümlerin</h3>
                  <p>Hücrelere D / Y / B sayılarını gir, otomatik toplanır</p>
                </div>
                <div className="qz-legend">
                  <span className="qz-legend-item"><span className="qz-dot d" /> Doğru</span>
                  <span className="qz-legend-item"><span className="qz-dot y" /> Yanlış</span>
                  <span className="qz-legend-item"><span className="qz-dot b" /> Boş</span>
                </div>
              </header>
              <div className="qz-panel-body">
                <table className="qz-grid">
                  <thead>
                    <tr>
                      <th className="qz-head-sub">Ders</th>
                      {detailWeekDays.map((day) => (
                        <th key={day.date}>{day.label}</th>
                      ))}
                      <th className="qz-head-total">Top.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessonNames.map((lessonName) => {
                      const rowTotal = detailWeekDays.reduce(
                        (sum, day) => sum + sumWeeklyCell(weeklyCells[lessonName]?.[day.date]).total,
                        0
                      );

                      return (
                        <tr key={lessonName}>
                          <td className="qz-subj">{lessonName}</td>
                          {detailWeekDays.map((day) => {
                            const cell = weeklyCells[lessonName]?.[day.date] ?? emptyWeeklyCell();
                            const disabled = effectiveReadOnly || day.date > today();
                            const tone = getCellTone(cell);

                            return (
                              <td
                                key={day.date}
                                className={`qz-cell ${tone}${disabled ? " ro" : ""}`}
                              >
                                <div className="qz-row">
                                  <span className="qz-tag d">D</span>
                                  <input
                                    inputMode="numeric"
                                    value={cell.correct}
                                    onChange={(e) =>
                                      handleCellChange(lessonName, day.date, "correct", e.target.value)
                                    }
                                    placeholder="—"
                                    disabled={disabled}
                                  />
                                </div>
                                <div className="qz-row">
                                  <span className="qz-tag y">Y</span>
                                  <input
                                    inputMode="numeric"
                                    value={cell.wrong}
                                    onChange={(e) =>
                                      handleCellChange(lessonName, day.date, "wrong", e.target.value)
                                    }
                                    placeholder="—"
                                    disabled={disabled}
                                  />
                                </div>
                                <div className="qz-row">
                                  <span className="qz-tag b">B</span>
                                  <input
                                    inputMode="numeric"
                                    value={cell.blank}
                                    onChange={(e) =>
                                      handleCellChange(lessonName, day.date, "blank", e.target.value)
                                    }
                                    placeholder="—"
                                    disabled={disabled}
                                  />
                                </div>
                              </td>
                            );
                          })}
                          <td className="qz-row-total"><b>{rowTotal}</b></td>
                        </tr>
                      );
                    })}
                    <tr className="qz-foot">
                      <td>Günlük</td>
                      {detailWeekDays.map((day) => {
                        const dayTotals = lessonNames.reduce(
                          (acc, lessonName) => {
                            const cellTotals = sumWeeklyCell(weeklyCells[lessonName]?.[day.date]);
                            acc.correct += cellTotals.correct;
                            acc.wrong += cellTotals.wrong;
                            acc.blank += cellTotals.blank;
                            return acc;
                          },
                          { correct: 0, wrong: 0, blank: 0 }
                        );

                        return (
                          <td key={day.date}>
                            <div className="qz-foot-line"><span className="qz-tag d">D</span>{dayTotals.correct}</div>
                            <div className="qz-foot-line"><span className="qz-tag y">Y</span>{dayTotals.wrong}</div>
                            <div className="qz-foot-line"><span className="qz-tag b">B</span>{dayTotals.blank}</div>
                          </td>
                        );
                      })}
                      <td className="qz-grand"><b>{weeklyTotals.total}</b></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {(error || saveMessage) && (
              <p className={error ? "student-question-error" : "student-question-success"}>
                {error || saveMessage}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
