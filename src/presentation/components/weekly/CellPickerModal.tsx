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
      className="exam-modal-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <section
        className="exam-modal-card weekly-lesson-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weekly-lesson-modal-title"
      >
        <div className="exam-modal-head">
          <div>
            <h2 id="weekly-lesson-modal-title">
              {view === "picker" ? "Hücre Düzenle" : "Yeni Ders Ekle"}
            </h2>
            <p>
              {DAY_LONG[col]} · {row + 1}. saat
            </p>
          </div>
          <button type="button" aria-label="Kapat" onClick={onClose}>×</button>
        </div>

        <div className="weekly-lesson-modal-body">
          {view === "picker" ? (
            <>
              <button
                type="button"
                onClick={() => setView("add-lesson")}
                className="weekly-lesson-add-button"
              >
                + Ders Ekle
              </button>

              {loading ? (
                <p className="weekly-lesson-empty">
                  Yükleniyor…
                </p>
              ) : lessons.length === 0 ? (
                <p className="weekly-lesson-empty">
                  Henüz ders eklenmedi. Yukarıdan ekleyin.
                </p>
              ) : (
                <div className="weekly-lesson-list">
                  {lessons.map((l) => (
                    <div key={l.id}>
                      {editingLesson?.id === l.id ? (
                        <div className="weekly-lesson-edit-row">
                          <input
                            autoFocus
                            className="weekly-lesson-field"
                            value={editLessonName}
                            onChange={(e) => setEditLessonName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") { setEditingLesson(null); setEditLessonName(""); }
                            }}
                          />
                          <button
                            type="button"
                            className="weekly-lesson-mini-button primary"
                            disabled={saving || !editLessonName.trim()}
                            onClick={handleSaveEdit}
                          >
                            {saving ? "…" : "Kaydet"}
                          </button>
                          <button
                            type="button"
                            className="weekly-lesson-mini-button ghost"
                            onClick={() => { setEditingLesson(null); setEditLessonName(""); }}
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <div
                          className={
                            "weekly-lesson-row" + (selectedLesson === l.name ? " selected" : "")
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedLesson(l.name)}
                            className="weekly-lesson-select"
                          >
                            {l.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(l)}
                            title="Düzenle"
                            className="weekly-lesson-icon-button"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(l)}
                            disabled={deletingId === l.id}
                            title="Sil"
                            className="weekly-lesson-icon-button danger"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedLesson && (
                <>
                  <label className="weekly-lesson-label">Not / Açıklama (isteğe bağlı)</label>
                  <textarea
                    className="weekly-lesson-textarea"
                    rows={3}
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    placeholder="Örn: 40 soru çöz · Hız ve Hareket konusu · TYT Matematik s.45-60"
                  />

                  <label className="weekly-lesson-label">Renk</label>
                  <div className="weekly-lesson-colors">
                    {PRESET_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        title={c}
                        className={"weekly-lesson-color" + (color === c ? " selected" : "")}
                        style={{ background: c }}
                      />
                    ))}
                  </div>

                  <div className="weekly-lesson-custom-color">
                    <div className="weekly-lesson-color-picker">
                      <div style={{ background: color }} />
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        title="Özel renk seç"
                      />
                    </div>
                    <span className="weekly-lesson-color-code">
                      {color}
                    </span>
                    <span className="weekly-lesson-color-hint">
                      — özel renk için tıkla
                    </span>
                  </div>

                  <div
                    className="weekly-lesson-preview"
                    style={{ backgroundColor: color + "22", borderLeftColor: color }}
                  >
                    {selectedLesson}
                    {sub && (
                      <div>
                        {sub}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="exam-modal-grid weekly-lesson-add-grid">
              <label className="optional">
                <span>Ders Adı</span>
              <input
                ref={inputRef}
                type="text"
                value={newLessonName}
                onChange={(e) => setNewLessonName(e.target.value)}
                placeholder="Matematik, Türkçe, Fizik…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddLesson();
                  if (e.key === "Escape") setView("picker");
                }}
              />
              </label>
              </div>
              <p className="weekly-lesson-help">
                Bu ders koçun tüm öğrencileri için kullanılabilir olacak.
              </p>
            </>
          )}
        </div>

        <div className="exam-modal-actions">
          {view === "picker" ? (
            <>
              {existing && (
                <button
                  type="button"
                  onClick={() => onSave(null)}
                  className="ghost danger"
                >
                  Hücreyi Temizle
                </button>
              )}
              <button type="button" onClick={onClose} className="ghost">İptal</button>
              <button
                type="button"
                onClick={handleSave}
                className="primary"
                disabled={!selectedLesson}
              >
                Kaydet
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setView("picker")} className="ghost">Geri</button>
              <button
                type="button"
                onClick={handleAddLesson}
                className="primary"
                disabled={!newLessonName.trim() || saving}
              >
                {saving ? "Ekleniyor…" : "Ekle"}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
