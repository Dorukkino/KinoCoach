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

export function StudentNotesTab({
  studentId,
  initialNotes,
}: {
  studentId: string;
  initialNotes?: CoachNoteDto[];
}) {
  const skipInitialLoad = useRef(initialNotes !== undefined);
  const [notes, setNotes] = useState<CoachNoteDto[]>(initialNotes ?? []);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setNotes(await getCoachNoteAction(studentId));
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
    channelName: `coach-notes-${studentId}`,
    table: "coach_notes",
    filter: `student_id=eq.${studentId}`,
    pollIntervalMs: 5000,
    onChange: load,
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
    startTransition(async () => {
      await deleteCoachNoteAction(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    });
  };

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold m-0">Yeni koç notu</h3>
            <p className="text-xs text-[var(--muted)] m-0 mt-1">
              Notlar sadece koç tarafından görüntülenir.
            </p>
          </div>
          <span className="text-xs text-[var(--muted)]">
            {notes.length} not
          </span>
        </div>
        <textarea
          className="input min-h-[120px] resize-y"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Görüşme özeti, takip edilecek konu veya öğrenciye dair özel not..."
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || !newNote.trim()}
            onClick={createNote}
          >
            Not Ekle
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-[var(--muted)]">
          Bu öğrenci için henüz not eklenmedi.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isEditing = editingId === note.id;
            return (
              <article key={note.id} className="coach-note-card">
                <div className="coach-note-card-header">
                  <div className="min-w-0">
                    <p className="coach-note-card-eyebrow">Özel koç notu</p>
                    <h4 className="coach-note-card-title">
                      {new Date(note.createdAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </h4>
                    <p className="coach-note-card-meta">
                      Son güncelleme:{" "}
                      {new Date(note.updatedAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        className="btn btn-outline text-xs"
                        disabled={pending}
                        onClick={() => startEdit(note)}
                      >
                        Düzenle
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline text-xs"
                      disabled={pending}
                      onClick={() => deleteNote(note.id)}
                      style={{ borderColor: "var(--risk)", color: "var(--risk)" }}
                    >
                      Sil
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      className="input min-h-[120px] resize-y"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={pending}
                        onClick={cancelEdit}
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={pending || !editingText.trim()}
                        onClick={() => saveEdit(note.id)}
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="coach-note-card-body">
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
