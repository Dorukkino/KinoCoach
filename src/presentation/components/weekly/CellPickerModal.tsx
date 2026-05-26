"use client";

import { useEffect, useRef, useState } from "react";
import { TaskCell } from "@/domain/value-objects/Grid7x10";
import {
  getCoachLessonsAction,
  addCoachLessonAction,
  deleteCoachLessonAction,
  CoachLesson,
} from "@/app/actions/coach-lessons";

const DAY_LONG = [
  "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar",
];

const PRESET_COLORS = [
  "#0d9488", "#d97706", "#e11d48", "#16a34a",
  "#059669", "#4f46e5", "#92400e", "#7c3aed",
  "#0ea5e9", "#db2777", "#65a30d", "#ea580c",
];

interface Props {
  row: number;
  col: number;
  existing: TaskCell | null;
  onSave: (cell: TaskCell | null) => void;
  onClose: () => void;
}

type View = "picker" | "add-lesson";

export function CellPickerModal({ row, col, existing, onSave, onClose }: Props) {
  const [view, setView] = useState<View>("picker");
  const [lessons, setLessons] = useState<CoachLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLessonName, setNewLessonName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<CoachLesson | null>(null);
  const [editLessonName, setEditLessonName] = useState("");

  const [selectedLesson, setSelectedLesson] = useState<string>(existing?.title ?? "");
  const [sub, setSub] = useState(existing?.sub ?? "");
  const [color, setColor] = useState(existing?.tone ?? "#0d9488");
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const reloadLessons = async () => {
    const ls = await getCoachLessonsAction();
    setLessons(ls);
  };

  useEffect(() => {
    getCoachLessonsAction().then((ls) => {
      setLessons(ls);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (view === "add-lesson") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [view]);

  const handleAddLesson = async () => {
    const name = newLessonName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const lesson = await addCoachLessonAction(name);
      await reloadLessons();
      setSelectedLesson(lesson.name);
      setNewLessonName("");
      setView("picker");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lesson: CoachLesson) => {
    setDeletingId(lesson.id);
    try {
      await deleteCoachLessonAction(lesson.id);
      await reloadLessons();
      if (selectedLesson === lesson.name) setSelectedLesson("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ders silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (lesson: CoachLesson) => {
    setEditingLesson(lesson);
    setEditLessonName(lesson.name);
  };

  const handleSaveEdit = async () => {
    if (!editingLesson || !editLessonName.trim()) return;
    const snapshot = { ...editingLesson };
    const newName = editLessonName.trim();
    setSaving(true);
    try {
      // Direkt DB'de güncelle — update action yerine delete+insert daha güvenilir
      await deleteCoachLessonAction(snapshot.id);
      const added = await addCoachLessonAction(newName);
      await reloadLessons();
      if (selectedLesson === snapshot.name) setSelectedLesson(added.name);
      setEditingLesson(null);
      setEditLessonName("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ders güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!selectedLesson) return;
    onSave({ title: selectedLesson, sub, tone: color, done: false });
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="panel"
        style={{
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 12px", borderBottom: "1px solid var(--border)",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {view === "picker" ? "Hücre Düzenle" : "Yeni Ders Ekle"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {DAY_LONG[col]} · {row + 1}. saat
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--bg)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "var(--muted)",
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {view === "picker" ? (
            <>
              {/* Ders Ekle butonu */}
              <button
                onClick={() => setView("add-lesson")}
                className="btn btn-outline"
                style={{ width: "100%", marginBottom: 12, justifyContent: "center" }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, marginRight: 4 }}>+</span>
                Ders Ekle
              </button>

              {/* Ders listesi */}
              {loading ? (
                <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "12px 0" }}>
                  Yükleniyor…
                </p>
              ) : lessons.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", padding: "12px 0" }}>
                  Henüz ders eklenmedi. Yukarıdan ekleyin.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
                  {lessons.map((l) => (
                    <div key={l.id}>
                      {editingLesson?.id === l.id ? (
                        /* Düzenleme satırı */
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            autoFocus
                            className="input"
                            style={{ flex: 1, padding: "6px 10px", fontSize: 13, height: 36 }}
                            value={editLessonName}
                            onChange={(e) => setEditLessonName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") { setEditingLesson(null); setEditLessonName(""); }
                            }}
                          />
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 12px", fontSize: 12, height: 36, flexShrink: 0 }}
                            disabled={saving || !editLessonName.trim()}
                            onClick={handleSaveEdit}
                          >
                            {saving ? "…" : "Kaydet"}
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "6px 10px", fontSize: 12, height: 36, flexShrink: 0 }}
                            onClick={() => { setEditingLesson(null); setEditLessonName(""); }}
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        /* Normal ders satırı */
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "var(--radius-sm)",
                          border: selectedLesson === l.name
                            ? "2px solid var(--accent)"
                            : "1px solid var(--border)",
                          background: selectedLesson === l.name
                            ? "var(--accent-soft)"
                            : "var(--bg-elev)",
                          overflow: "hidden",
                        }}>
                          {/* Seçme alanı */}
                          <button
                            onClick={() => setSelectedLesson(l.name)}
                            style={{
                              flex: 1,
                              padding: "10px 14px",
                              background: "transparent",
                              border: "none",
                              color: selectedLesson === l.name ? "var(--accent-ink)" : "var(--ink)",
                              fontWeight: selectedLesson === l.name ? 600 : 400,
                              fontSize: 13,
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                          >
                            {l.name}
                          </button>
                          {/* Düzenle butonu */}
                          <button
                            onClick={() => handleStartEdit(l)}
                            title="Düzenle"
                            style={{
                              padding: "8px 10px",
                              background: "transparent",
                              border: "none",
                              borderLeft: "1px solid var(--border)",
                              color: "var(--muted)",
                              fontSize: 14,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            ✏️
                          </button>
                          {/* Sil butonu */}
                          <button
                            onClick={() => handleDeleteLesson(l)}
                            disabled={deletingId === l.id}
                            title="Sil"
                            style={{
                              padding: "8px 10px",
                              background: "transparent",
                              border: "none",
                              borderLeft: "1px solid var(--border)",
                              color: "var(--risk)",
                              fontSize: 16,
                              cursor: deletingId === l.id ? "not-allowed" : "pointer",
                              opacity: deletingId === l.id ? 0.4 : 1,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Alt bilgi + not + renk — sadece ders seçiliyse */}
              {selectedLesson && (
                <>
                  <label className="label">Not / Açıklama (isteğe bağlı)</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    placeholder="Örn: 40 soru çöz · Hız ve Hareket konusu · TYT Matematik s.45-60"
                    style={{ resize: "vertical", marginBottom: 16, fontFamily: "inherit" }}
                  />

                  <label className="label">Renk</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        title={c}
                        style={{
                          width: 26, height: 26,
                          borderRadius: "50%",
                          background: c,
                          border: color === c ? "3px solid var(--ink)" : "2px solid transparent",
                          outline: color === c ? "2px solid white" : "none",
                          outlineOffset: -3,
                          transition: "border 100ms",
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: color,
                        border: "2px solid var(--border-strong)",
                        cursor: "pointer",
                      }} />
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{
                          position: "absolute", inset: 0,
                          opacity: 0, width: "100%", height: "100%",
                          cursor: "pointer",
                        }}
                        title="Özel renk seç"
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>
                      {color}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      — özel renk için tıkla
                    </span>
                  </div>

                  {/* Önizleme */}
                  <div style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: color + "22",
                    borderLeft: `3px solid ${color}`,
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {selectedLesson}
                    {sub && (
                      <div style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginTop: 4, whiteSpace: "pre-wrap" }}>
                        {sub}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            /* Yeni ders ekleme ekranı */
            <>
              <label className="label">Ders Adı</label>
              <input
                ref={inputRef}
                className="input"
                value={newLessonName}
                onChange={(e) => setNewLessonName(e.target.value)}
                placeholder="Matematik, Türkçe, Fizik…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddLesson();
                  if (e.key === "Escape") setView("picker");
                }}
                style={{ marginBottom: 4 }}
              />
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                Bu ders koçun tüm öğrencileri için kullanılabilir olacak.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: 8, justifyContent: "flex-end",
        }}>
          {view === "picker" ? (
            <>
              {existing && (
                <button
                  onClick={() => onSave(null)}
                  className="btn btn-outline"
                  style={{ color: "var(--risk)", borderColor: "var(--risk)", marginRight: "auto" }}
                >
                  Hücreyi Temizle
                </button>
              )}
              <button onClick={onClose} className="btn btn-outline">İptal</button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={!selectedLesson}
                style={{ opacity: selectedLesson ? 1 : 0.5 }}
              >
                Kaydet
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setView("picker")} className="btn btn-outline">Geri</button>
              <button
                onClick={handleAddLesson}
                className="btn btn-primary"
                disabled={!newLessonName.trim() || saving}
                style={{ opacity: newLessonName.trim() && !saving ? 1 : 0.5 }}
              >
                {saving ? "Ekleniyor…" : "Ekle"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
