"use client";

import { useCallback, useEffect, useRef, useState, useTransition, useMemo } from "react";
import { listExamResultsAction, createExamResultAction } from "@/app/actions/exams";
import { ExamResultDto } from "@/application/dto";
import { ExamLineChart } from "@/presentation/components/charts/ExamLineChart";
import { ChartDataService } from "@/application/services/ChartDataService";
import { ExamResult } from "@/domain/entities/ExamResult";
import { ExamScores } from "@/domain/value-objects/ExamScores";
import { sortByDateAsc } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

const chartService = new ChartDataService();

const SUBJECT_LABELS: Record<string, string> = {
  total: "Toplam",
  turkish: "Türkçe",
  math: "Matematik",
  science: "Fen",
  social: "Sosyal",
  english: "İngilizce",
};

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
  role = "coach",
  initialRows,
}: {
  studentId: string;
  role?: "coach" | "student";
  initialRows?: ExamResultDto[];
}) {
  const skipInitialLoad = useRef(initialRows !== undefined);
  const [rows, setRows] = useState<ExamResultDto[]>(initialRows ?? []);
  const [subject, setSubject] = useState<"total" | "turkish" | "math" | "science" | "social" | "english">("total");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddFormState>(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      setRows(await listExamResultsAction(studentId));
    });
  }, [studentId, startTransition]);

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }
    load();
  }, [load]);

  useSupabaseTableRealtime({
    channelName: `exam-results-${studentId}`,
    table: "exam_results",
    filter: `student_id=eq.${studentId}`,
    pollIntervalMs: 5000,
    onChange: load,
  });

  useEffect(() => {
    if (showForm) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [showForm]);

  const set = (field: keyof AddFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const turkish = parseFloat(form.turkish);
    const math    = parseFloat(form.math);
    const science = parseFloat(form.science);
    const social  = parseFloat(form.social);
    const english = (form.english ?? "").trim() !== "" ? parseFloat(form.english) : null;

    if (!form.date) { setError("Tarih giriniz."); return; }
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
      await createExamResultAction(studentId, form.date, { turkish, math, science, social, english }, form.note);
      setForm(emptyForm());
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const sortedRows = useMemo(
    () => sortByDateAsc(rows, (r) => r.date),
    [rows]
  );

  const entities = sortedRows.map(
    (r) =>
      new ExamResult(
        r.id,
        r.studentId,
        new Date(r.date),
        new ExamScores(r.turkish, r.math, r.science, r.social, r.english ?? null)
      )
  );
  const chart = chartService.buildChart(entities, subject);

  return (
    <div>
      {/* Ekleme butonu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {(["total", "turkish", "math", "science", "social", "english"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-tab${subject === s ? " active" : ""}`}
              onClick={() => setSubject(s)}
            >
              {SUBJECT_LABELS[s]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setError(""); }}
        >
          + Deneme Ekle
        </button>
      </div>

      {/* Ekleme formu */}
      {showForm && (
        <div className="panel p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontWeight: 700, fontSize: 15 }}>Yeni Deneme Sonucu</span>
            <button
              onClick={() => setShowForm(false)}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--bg)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "var(--muted)",
              }}
            >×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {/* Tarih — tam satır */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Tarih</label>
              <input
                ref={firstInputRef}
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Türkçe Net</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="40"
                className="input"
                placeholder="0"
                value={form.turkish}
                onChange={(e) => set("turkish", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Matematik Net</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="40"
                className="input"
                placeholder="0"
                value={form.math}
                onChange={(e) => set("math", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Fen Net</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                className="input"
                placeholder="0"
                value={form.science}
                onChange={(e) => set("science", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Sosyal Net</label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="20"
                className="input"
                placeholder="0"
                value={form.social}
                onChange={(e) => set("social", e.target.value)}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">
                İngilizce Net{" "}
                <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>(isteğe bağlı)</span>
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="80"
                className="input"
                placeholder="Girilmeyebilir"
                value={form.english}
                onChange={(e) => set("english", e.target.value)}
              />
            </div>

            {/* Not — tam satır */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Not (isteğe bağlı)</label>
              <input
                type="text"
                className="input"
                placeholder="Örn: TYT Deneme 3, 2 saat, AYT Matematik…"
                value={form.note ?? ""}
                onChange={(e) => set("note", e.target.value)}
              />
            </div>
          </div>

          {/* Toplam önizleme */}
          {[form.turkish, form.math, form.science, form.social].every((v) => v !== "") && (
            <div style={{
              marginTop: 8,
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
              fontSize: 13,
              fontWeight: 600,
            }}>
              Toplam Net:{" "}
              {(
                parseFloat(form.turkish || "0") +
                parseFloat(form.math || "0") +
                parseFloat(form.science || "0") +
                parseFloat(form.social || "0") +
                ((form.english ?? "").trim() !== "" ? parseFloat(form.english || "0") : 0)
              ).toFixed(2)}
            </div>
          )}

          {error && (
            <p style={{ color: "var(--risk)", fontSize: 13, marginTop: 8 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setShowForm(false); setError(""); }}
            >
              İptal
            </button>
            <button
              type="button"
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

      {/* Grafik */}
      {sortedRows.length > 0 && (
        <div className="panel p-4 mb-4">
          <ExamLineChart data={chart.points} />
        </div>
      )}

      {/* Tablo */}
      {sortedRows.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-[var(--muted)]">
          Henüz deneme sonucu eklenmedi.
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] bg-[var(--bg-elev)]">
                <th className="p-3">Tarih</th>
                <th className="p-3">Türkçe</th>
                <th className="p-3">Mat</th>
                <th className="p-3">Fen</th>
                <th className="p-3">Sosyal</th>
                {sortedRows.some((r) => r.english != null) && (
                  <th className="p-3">İng</th>
                )}
                <th className="p-3 font-bold">Toplam</th>
                <th className="p-3">Not</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--bg-elev)]">
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">{r.turkish}</td>
                  <td className="p-3">{r.math}</td>
                  <td className="p-3">{r.science}</td>
                  <td className="p-3">{r.social}</td>
                  {sortedRows.some((x) => x.english != null) && (
                    <td className="p-3">{r.english != null ? r.english : "—"}</td>
                  )}
                  <td className="p-3 font-semibold">{r.total}</td>
                  <td className="p-3 text-[var(--muted)]">{r.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
