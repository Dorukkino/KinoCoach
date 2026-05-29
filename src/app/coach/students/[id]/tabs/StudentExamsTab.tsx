"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  useMemo,
} from "react";
import type { MouseEvent, RefObject } from "react";
import {
  listExamResultsAction,
  createExamResultAction,
  updateExamResultAction,
  deleteExamResultAction,
} from "@/app/actions/exams";
import { ExamResultDto } from "@/application/dto";
import { ChartDataService } from "@/application/services/ChartDataService";
import { ExamResult } from "@/domain/entities/ExamResult";
import { ExamScores } from "@/domain/value-objects/ExamScores";
import { formatTRDate, sortByDateAsc, sortByDateNearToday } from "@/lib/dates";
import { DateInputTR } from "@/presentation/components/ui/DateInputTR";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

const chartService = new ChartDataService();

const SUBJECT_LABELS: Record<string, string> = {
  total: "Toplam",
  turkish: "Türkçe",
  math: "Matematik",
  science: "Fen",
  social: "Sosyal",
  english: "İngilizce",
};

type ExamSubjectKey = "total" | "turkish" | "math" | "science" | "social" | "english";

interface RowMenuState {
  id: string;
  top: number;
  left: number;
}

const today = () => new Date().toISOString().slice(0, 10);

interface AddFormState {
  date: string;
  turkish: string;
  math: string;
  science: string;
  social: string;
  english: string;
  note: string;
}

const emptyForm = (): AddFormState => ({
  date: today(),
  turkish: "",
  math: "",
  science: "",
  social: "",
  english: "",
  note: "",
});

export function StudentExamsTab({
  studentId,
  initialRows,
  detailVariant = false,
}: {
  studentId: string;
  role?: "coach" | "student";
  initialRows?: ExamResultDto[];
  detailVariant?: boolean;
}) {
  const skipInitialLoad = useRef(initialRows !== undefined);
  const [rows, setRows] = useState<ExamResultDto[]>(initialRows ?? []);
  const [loading, setLoading] = useState(initialRows === undefined);
  const [subject, setSubject] = useState<ExamSubjectKey>("total");
  const [showForm, setShowForm] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [editingRow, setEditingRow] = useState<ExamResultDto | null>(null);
  const [openMenu, setOpenMenu] = useState<RowMenuState | null>(null);
  const [form, setForm] = useState<AddFormState>(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true);
    startTransition(async () => {
      try {
        setRows(await listExamResultsAction(studentId));
      } finally {
        setLoading(false);
      }
    });
  }, [studentId, startTransition]);

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }
    load(true);
  }, [load]);

  useSupabaseTableRealtime({
    channelName: `exam-results-${studentId}`,
    table: "exam_results",
    filter: `student_id=eq.${studentId}`,
    onChange: () => load(false),
  });

  useEffect(() => {
    if (showForm) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [showForm]);

  const set = (field: keyof AddFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreateForm = () => {
    setEditingRow(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  const openEditForm = (row: ExamResultDto) => {
    setEditingRow(row);
    setForm({
      date: row.date,
      turkish: String(row.turkish),
      math: String(row.math),
      science: String(row.science),
      social: String(row.social),
      english: row.english != null ? String(row.english) : "",
      note: row.note ?? "",
    });
    setOpenMenu(null);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRow(null);
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu deneme sonucunu silmek istiyor musunuz?")) return;
    setOpenMenu(null);
    startTransition(async () => {
      try {
        await deleteExamResultAction(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
      } catch (e) {
        alert(e instanceof Error ? e.message : "Silinemedi.");
      }
    });
  };

  const toggleRowMenu = (
    id: string,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 86;
    const opensUp = window.innerHeight - rect.bottom < menuHeight + 12;
    const nextMenu = {
      id,
      top: opensUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
      left: Math.max(12, rect.right - 112),
    };

    setOpenMenu((current) => {
      if (current?.id === id) return null;
      return nextMenu;
    });
  };

  const handleSubmit = async () => {
    const turkish = parseFloat(form.turkish);
    const math    = parseFloat(form.math);
    const science = parseFloat(form.science);
    const social  = parseFloat(form.social);
    const english = (form.english ?? "").trim() !== "" ? parseFloat(form.english) : null;

    if (!form.date) {
      setError("Geçerli bir tarih giriniz (GG/AA/YYYY).");
      return;
    }
    if ([turkish, math, science, social].some(isNaN)) {
      setError("Türkçe, Matematik, Fen ve Sosyal net alanlarını doldurunuz.");
      return;
    }
    if (english !== null && isNaN(english)) {
      setError("İngilizce net değeri geçersiz.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editingRow) {
        await updateExamResultAction(
          editingRow.id,
          form.date,
          { turkish, math, science, social, english },
          form.note
        );
      } else {
        await createExamResultAction(
          studentId,
          form.date,
          { turkish, math, science, social, english },
          form.note
        );
      }
      closeForm();
      setForm(emptyForm());
      load(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const tableRows = useMemo(
    () => sortByDateNearToday(rows, (r) => r.date),
    [rows]
  );

  const chartRows = useMemo(
    () => sortByDateAsc(rows, (r) => r.date),
    [rows]
  );

  const chartRowsForDisplay = detailVariant ? chartRows.slice(-8) : chartRows;
  const latestChartRow = chartRowsForDisplay.at(-1);
  const previousChartRow = chartRowsForDisplay.at(-2);
  const selectedLatestValue = latestChartRow
    ? getSubjectScore(latestChartRow, subject)
    : null;
  const selectedPreviousValue = previousChartRow
    ? getSubjectScore(previousChartRow, subject)
    : null;
  const selectedDelta =
    selectedLatestValue !== null && selectedPreviousValue !== null
      ? selectedLatestValue - selectedPreviousValue
      : null;
  const latestTotalValue = latestChartRow?.total ?? null;

  const entities = chartRowsForDisplay.map(
    (r) =>
      new ExamResult(
        r.id,
        r.studentId,
        new Date(r.date),
        new ExamScores(r.turkish, r.math, r.science, r.social, r.english ?? null)
      )
  );
  const chart = chartService.buildChart(entities, subject);

  if (detailVariant) {
    return (
      <div className="coach-detail-exams">
        {showForm && (
          <ExamResultModal
            form={form}
            title={editingRow ? "Deneme neti düzenle" : "Deneme net ekle"}
            saving={saving}
            error={error}
            firstInputRef={firstInputRef}
            onChange={set}
            onClose={closeForm}
            onSubmit={handleSubmit}
          />
        )}

        {loading ? (
          <LoadingScreen className="panel" />
        ) : (
          <>
            {chartRowsForDisplay.length > 0 ? (
              <section className="coach-exam-chart-card">
                <div className="coach-exam-chart-head">
                  <div>
                    <h2>{chart.label} gelişimi</h2>
                    <p>Son {Math.min(chartRowsForDisplay.length, 8)} deneme</p>
                  </div>
                  <div className="coach-exam-head-actions">
                    <div className="coach-exam-filter-tabs">
                      {(["total", "turkish", "math", "science", "social"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`coach-exam-filter${subject === s ? " active" : ""}`}
                          onClick={() => setSubject(s)}
                        >
                          {SUBJECT_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="coach-exam-add-btn"
                      onClick={openCreateForm}
                    >
                      + Deneme Ekle
                    </button>
                  </div>
                </div>

                <div className="coach-exam-chart-body">
                  <aside className="coach-exam-summary">
                    <span>Son deneme</span>
                    <strong>{formatNet(selectedLatestValue)}</strong>
                    {selectedDelta !== null && (
                      <em className={selectedDelta >= 0 ? "positive" : "negative"}>
                        {formatDelta(selectedDelta)} net
                      </em>
                    )}
                    <small>geçen denemeye göre</small>
                  </aside>
                  <CoachDetailExamChart data={chart.points} />
                </div>
              </section>
            ) : (
              <div className="coach-detail-empty-card">
                <span>Henüz deneme sonucu eklenmedi.</span>
                <button
                  type="button"
                  className="coach-exam-add-btn"
                  onClick={openCreateForm}
                >
                  + Deneme Ekle
                </button>
              </div>
            )}

            {tableRows.length > 0 && (
              <section className="coach-exam-table-card">
                <div className="coach-exam-table-head">
                  <h2>Deneme listesi</h2>
                  <p>Hücreyi tıklayarak değer düzenle</p>
                </div>
                <div className="coach-exam-table-scroll">
                  <table className="coach-exam-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Türkçe</th>
                        <th>Matematik</th>
                        <th>Fen</th>
                        <th>Sosyal</th>
                        {tableRows.some((r) => r.english != null) && <th>İngilizce</th>}
                        <th>Toplam</th>
                        <th aria-label="İşlemler" />
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((r) => (
                        <tr key={r.id}>
                          <td>{formatTRDate(r.date)}</td>
                          <td>{formatNet(r.turkish)}</td>
                          <td>{formatNet(r.math)}</td>
                          <td>{formatNet(r.science)}</td>
                          <td>{formatNet(r.social)}</td>
                          {tableRows.some((x) => x.english != null) && (
                            <td>{r.english != null ? formatNet(r.english) : "—"}</td>
                          )}
                          <td>
                            <strong>{formatNet(r.total)}</strong>
                          </td>
                          <td className="coach-exam-row-actions">
                            <button
                              type="button"
                              className="coach-exam-kebab"
                              aria-label="Deneme işlemleri"
                              onClick={(event) => toggleRowMenu(r.id, event)}
                            >
                              ...
                            </button>
                            {openMenu?.id === r.id && (
                              <>
                                <button
                                  type="button"
                                  className="coach-exam-menu-scrim"
                                  aria-label="Menüyü kapat"
                                  onClick={() => setOpenMenu(null)}
                                />
                                <div
                                  className="coach-exam-row-menu"
                                  style={{
                                    top: openMenu.top,
                                    left: openMenu.left,
                                  }}
                                >
                                  <button type="button" onClick={() => openEditForm(r)}>
                                    Düzenle
                                  </button>
                                  <button
                                    type="button"
                                    className="danger"
                                    onClick={() => handleDelete(r.id)}
                                  >
                                    Sil
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="student-exams-screen">
      <div className="page-head student-exams-page-head">
        <div className="page-title">
          <h1>Deneme Netleri</h1>
          <p>
            {chartRows.length} deneme
            {latestTotalValue !== null
              ? ` · son denemede toplam ${formatNet(latestTotalValue)} net`
              : ""}
          </p>
        </div>
        <div className="student-exams-actions">
          <div className="student-exams-filter-wrap">
            <button
              type="button"
              className="student-exams-outline-btn"
              onClick={() => setShowFilterMenu((current) => !current)}
              aria-expanded={showFilterMenu}
            >
              <span aria-hidden="true">≡</span>
              Filtrele
            </button>
            {showFilterMenu && (
              <div className="student-exams-filter-menu">
                {(["total", "turkish", "math", "science", "social"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={subject === s ? "active" : ""}
                    onClick={() => {
                      setSubject(s);
                      setShowFilterMenu(false);
                    }}
                  >
                    {SUBJECT_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="coach-exam-add-btn" onClick={openCreateForm}>
            + Deneme Ekle
          </button>
        </div>
      </div>

      {showForm && (
        <ExamResultModal
          form={form}
          title={editingRow ? "Deneme neti düzenle" : "Deneme net ekle"}
          saving={saving}
          error={error}
          firstInputRef={firstInputRef}
          onChange={set}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {loading ? (
        <LoadingScreen className="panel" />
      ) : (
        <div className="student-exams-content">
          {chartRows.length > 0 ? (
            <section className="coach-exam-chart-card student-exams-chart-card">
              <div className="coach-exam-chart-head">
                <div>
                  <h2>{chart.label} gelişimi</h2>
                  <p>Son {chartRowsForDisplay.length} deneme</p>
                </div>
                <div className="coach-exam-filter-tabs">
                  {(["total", "turkish", "math", "science", "social"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`coach-exam-filter${subject === s ? " active" : ""}`}
                      onClick={() => setSubject(s)}
                    >
                      {SUBJECT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="coach-exam-chart-body student-exams-chart-body">
                <aside className="coach-exam-summary">
                  <span>Son sonuç</span>
                  <strong>{formatNet(selectedLatestValue)}</strong>
                  {selectedDelta !== null && (
                    <em className={selectedDelta >= 0 ? "positive" : "negative"}>
                      {formatDelta(selectedDelta)} net
                    </em>
                  )}
                  <small>geçen denemeye göre</small>
                </aside>
                <CoachDetailExamChart data={chart.points} />
              </div>
            </section>
          ) : (
            <div className="coach-detail-empty-card">
              <span>Henüz deneme sonucu eklenmedi.</span>
              <button type="button" className="coach-exam-add-btn" onClick={openCreateForm}>
                + Deneme Ekle
              </button>
            </div>
          )}

          {tableRows.length > 0 && (
            <section className="coach-exam-table-card">
              <div className="coach-exam-table-head">
                <div>
                  <h2>Deneme listesi</h2>
                  <p>Hücreye tıklayarak değer düzenle</p>
                </div>
              </div>
              <div className="coach-exam-table-scroll">
                <table className="coach-exam-table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Türkçe</th>
                      <th>Matematik</th>
                      <th>Fen</th>
                      <th>Sosyal</th>
                      {tableRows.some((r) => r.english != null) && <th>İngilizce</th>}
                      <th>Toplam</th>
                      <th aria-label="İşlemler" />
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <button type="button" className="student-exams-cell-btn" onClick={() => openEditForm(r)}>
                            {formatTRDate(r.date)}
                          </button>
                        </td>
                        <td>
                          <button type="button" className="student-exams-cell-btn" onClick={() => openEditForm(r)}>
                            {formatNet(r.turkish)}
                          </button>
                        </td>
                        <td>
                          <button type="button" className="student-exams-cell-btn" onClick={() => openEditForm(r)}>
                            {formatNet(r.math)}
                          </button>
                        </td>
                        <td>
                          <button type="button" className="student-exams-cell-btn" onClick={() => openEditForm(r)}>
                            {formatNet(r.science)}
                          </button>
                        </td>
                        <td>
                          <button type="button" className="student-exams-cell-btn" onClick={() => openEditForm(r)}>
                            {formatNet(r.social)}
                          </button>
                        </td>
                        {tableRows.some((x) => x.english != null) && (
                          <td>
                            <button type="button" className="student-exams-cell-btn" onClick={() => openEditForm(r)}>
                              {r.english != null ? formatNet(r.english) : "—"}
                            </button>
                          </td>
                        )}
                        <td>
                          <button
                            type="button"
                            className="student-exams-cell-btn student-exams-total-cell"
                            onClick={() => openEditForm(r)}
                          >
                            {formatNet(r.total)}
                          </button>
                        </td>
                        <td className="coach-exam-row-actions">
                          <button
                            type="button"
                            className="coach-exam-kebab"
                            aria-label="Deneme işlemleri"
                            onClick={(event) => toggleRowMenu(r.id, event)}
                          >
                            ...
                          </button>
                          {openMenu?.id === r.id && (
                            <>
                              <button
                                type="button"
                                className="coach-exam-menu-scrim"
                                aria-label="Menüyü kapat"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div
                                className="coach-exam-row-menu"
                                style={{ top: openMenu.top, left: openMenu.left }}
                              >
                                <button type="button" onClick={() => openEditForm(r)}>
                                  Düzenle
                                </button>
                                <button type="button" className="danger" onClick={() => handleDelete(r.id)}>
                                  Sil
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function getSubjectScore(row: ExamResultDto, subject: ExamSubjectKey) {
  if (subject === "english") return row.english ?? null;
  return row[subject];
}

function ExamResultModal({
  form,
  title,
  saving,
  error,
  firstInputRef,
  onChange,
  onClose,
  onSubmit,
}: {
  form: AddFormState;
  title: string;
  saving: boolean;
  error: string;
  firstInputRef: RefObject<HTMLInputElement | null>;
  onChange: (field: keyof AddFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="exam-modal-backdrop" role="presentation">
      <section
        className="exam-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-modal-title"
      >
        <div className="exam-modal-head">
          <div>
            <h2 id="exam-modal-title">{title}</h2>
            <p>Yeni deneme sonuçlarını gir</p>
          </div>
          <button type="button" aria-label="Kapat" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="exam-modal-grid">
          <label>
            <span>Tarih</span>
            <DateInputTR
              ref={firstInputRef}
              value={form.date}
              onChange={(iso) => onChange("date", iso)}
            />
          </label>
          <label>
            <span>Deneme adı</span>
            <input
              type="text"
              value={form.note}
              onChange={(event) => onChange("note", event.target.value)}
              placeholder="30 TYT Deneme 9"
            />
          </label>
          <label>
            <span>Türkçe</span>
            <input
              type="number"
              step="0.25"
              min="0"
              max="40"
              value={form.turkish}
              onChange={(event) => onChange("turkish", event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            <span>Matematik</span>
            <input
              type="number"
              step="0.25"
              min="0"
              max="40"
              value={form.math}
              onChange={(event) => onChange("math", event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            <span>Fen</span>
            <input
              type="number"
              step="0.25"
              min="0"
              max="20"
              value={form.science}
              onChange={(event) => onChange("science", event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            <span>Sosyal</span>
            <input
              type="number"
              step="0.25"
              min="0"
              max="20"
              value={form.social}
              onChange={(event) => onChange("social", event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="optional">
            <span>İngilizce <small>(opsiyonel)</small></span>
            <input
              type="number"
              step="0.25"
              min="0"
              max="80"
              value={form.english}
              onChange={(event) => onChange("english", event.target.value)}
              placeholder="0.00"
            />
          </label>
        </div>

        {error && <p className="exam-modal-error">{error}</p>}

        <div className="exam-modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="button" className="primary" disabled={saving} onClick={onSubmit}>
            {saving ? "Kaydediliyor" : "Kaydet"}
          </button>
        </div>
      </section>
    </div>
  );
}

function formatNet(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

function formatDelta(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const sign = value > 0 ? "+" : "";
  const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return `${sign}${formatted}`;
}

function CoachDetailExamChart({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  const width = 760;
  const height = 252;
  const pad = { top: 18, right: 18, bottom: 34, left: 42 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const maxValue = Math.max(125, ...data.map((point) => point.value));
  const domainMax = Math.ceil(maxValue / 25) * 25;
  const ticks = Array.from({ length: 5 }, (_, index) =>
    Math.round((domainMax / 4) * index)
  ).reverse();

  const points = data.map((point, index) => {
    const x =
      pad.left +
      (data.length <= 1 ? plotWidth / 2 : (plotWidth / (data.length - 1)) * index);
    const y = pad.top + plotHeight - (point.value / domainMax) * plotHeight;
    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points.at(-1)?.x ?? pad.left} ${pad.top + plotHeight} L ${
          points[0].x
        } ${pad.top + plotHeight} Z`
      : "";

  return (
    <div className="coach-exam-chart-wrap">
      <svg
        className="coach-exam-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Deneme netleri gelişim grafiği"
      >
        <defs>
          <linearGradient id="coachExamAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fcfc5" stopOpacity="0.28" />
            <stop offset="62%" stopColor="#bce5de" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = pad.top + plotHeight - (tick / domainMax) * plotHeight;
          return (
            <g key={tick}>
              <text x={pad.left - 13} y={y + 3} className="coach-exam-y-label">
                {tick}
              </text>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                className="coach-exam-grid-line"
              />
            </g>
          );
        })}

        {areaPath && <path d={areaPath} className="coach-exam-area" />}
        {linePath && <path d={linePath} className="coach-exam-line" />}

        {points.map((point, index) => (
          <g key={`${point.date}-${point.value}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4.4" className="coach-exam-dot" />
            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              className="coach-exam-x-label"
            >
              {point.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
