"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteCoachNoteAction,
  getCoachNoteAction,
  updateCoachNoteAction,
  upsertCoachNoteAction,
} from "@/app/actions/notes";
import type { CoachNoteDto } from "@/application/dto";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

export function StudentNotesTab({
  studentId,
  initialNotes,
}: {
  studentId: string;
  initialNotes?: CoachNoteDto[];
}) {
  const skipInitialLoad = useRef(initialNotes !== undefined);
  const [notes, setNotes] = useState<CoachNoteDto[]>(initialNotes ?? []);
  const [loading, setLoading] = useState(initialNotes === undefined);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true);
    startTransition(async () => {
      try {
        setNotes(await getCoachNoteAction(studentId));
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
    channelName: `coach-notes-${studentId}`,
    table: "coach_notes",
    filter: `student_id=eq.${studentId}`,
    onChange: () => load(false),
  });

  const createNote = () => {
    const value = newNote.trim();
    if (!value) return;
    startTransition(async () => {
      const created = await upsertCoachNoteAction(studentId, value);
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
    });
  };

  const startEdit = (note: CoachNoteDto) => {
    setActionMenuId(null);
    setEditingId(note.id);
    setEditingText(note.note);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = (noteId: string) => {
    const value = editingText.trim();
    if (!value) return;
    startTransition(async () => {
      const updated = await updateCoachNoteAction(noteId, value);
      setNotes((prev) =>
        prev.map((note) => (note.id === updated.id ? updated : note))
      );
      cancelEdit();
    });
  };

  const deleteNote = (noteId: string) => {
    if (!confirm("Bu notu silmek istiyor musun?")) return;
    setActionMenuId(null);
    startTransition(async () => {
      await deleteCoachNoteAction(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    });
  };

  return (
    <div className="student-notes-tab">
      <section className="student-note-composer" aria-label="Yeni koç notu">
        <textarea
          className="student-note-input"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Yeni not... (örn: Motivasyonu düştü, matematikte eksik var)"
          spellCheck={false}
        />
        <div className="student-note-composer-actions">
          <button
            type="button"
            className="student-note-save"
            disabled={pending || !newNote.trim()}
            onClick={createNote}
          >
            <span aria-hidden="true">✓</span>
            Kaydet
          </button>
        </div>
      </section>

      {loading ? (
        <LoadingScreen className="student-note-loading" />
      ) : notes.length === 0 ? (
        <div className="student-note-empty">
          Bu öğrenci için henüz not eklenmedi.
        </div>
      ) : (
        <div className="student-note-list">
          {notes.map((note) => {
            const isEditing = editingId === note.id;
            return (
              <article key={note.id} className="student-note-card">
                <div className="student-note-card-top">
                  <div className="student-note-card-meta">
                    <time dateTime={note.createdAt}>
                      {formatNoteDate(note.createdAt)}
                    </time>
                  </div>
                  <div className="student-note-menu-wrap">
                    <button
                      type="button"
                      className="student-note-menu-btn"
                      aria-label="Not işlemleri"
                      aria-expanded={actionMenuId === note.id}
                      disabled={pending}
                      onClick={() =>
                        setActionMenuId((current) =>
                          current === note.id ? null : note.id
                        )
                      }
                    >
                      ...
                    </button>
                    {actionMenuId === note.id && !isEditing && (
                      <div className="student-note-menu">
                        <button
                          type="button"
                          className="student-note-menu-item"
                          disabled={pending}
                          onClick={() => startEdit(note)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="student-note-menu-item danger"
                          disabled={pending}
                          onClick={() => deleteNote(note.id)}
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="student-note-edit">
                    <textarea
                      className="student-note-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      spellCheck={false}
                    />
                    <div className="student-note-edit-actions">
                      <button
                        type="button"
                        className="student-note-cancel"
                        disabled={pending}
                        onClick={cancelEdit}
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        className="student-note-save"
                        disabled={pending || !editingText.trim()}
                        onClick={() => saveEdit(note.id)}
                      >
                        <span aria-hidden="true">✓</span>
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="student-note-card-body">
                    {note.note}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatNoteDate(value: string) {
  return new Date(value)
    .toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
    })
    .replace(".", "")
    .toLocaleUpperCase("tr-TR");
}

