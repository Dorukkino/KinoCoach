"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  deleteCoachNoteAction,
  updateCoachNoteAction,
  upsertCoachNoteAction,
} from "@/app/actions/notes";
import type { CoachNoteListItemDto } from "@/application/dto";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";

export function CoachNotesClient({
  students,
  notes,
}: {
  students: CoachStudentRowDto[];
  notes: CoachNoteListItemDto[];
}) {
  const [noteItems, setNoteItems] = useState(notes);
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setNoteItems(notes);
  }, [notes]);

  const noteCountByStudent = useMemo(() => {
    return noteItems.reduce((acc, note) => {
      acc.set(note.studentId, (acc.get(note.studentId) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
  }, [noteItems]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    if (!query) return students;
    return students.filter((student) =>
      student.name.toLocaleLowerCase("tr-TR").includes(query)
    );
  }, [search, students]);

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ??
    filteredStudents[0] ??
    students[0];

  const visibleNotes = useMemo(() => {
    if (!selectedStudent) return [];
    return noteItems.filter((note) => note.studentId === selectedStudent.id);
  }, [noteItems, selectedStudent]);

  const saveNote = () => {
    if (!selectedStudent) return;
    const value = draft.trim();
    if (!value) return;

    startTransition(async () => {
      const created = await upsertCoachNoteAction(selectedStudent.id, value);
      setNoteItems((current) => [
        {
          ...created,
          studentName: selectedStudent.name,
        },
        ...current,
      ]);
      setDraft("");
    });
  };

  const startEdit = (note: CoachNoteListItemDto) => {
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
      setNoteItems((current) =>
        current.map((note) =>
          note.id === updated.id ? { ...note, ...updated } : note
        )
      );
      cancelEdit();
    });
  };

  const deleteNote = (noteId: string) => {
    if (!confirm("Bu notu silmek istiyor musun?")) return;

    setActionMenuId(null);
    startTransition(async () => {
      await deleteCoachNoteAction(noteId);
      setNoteItems((current) => current.filter((note) => note.id !== noteId));
    });
  };

  return (
    <div className="coach-notes-page">
      <header className="coach-notes-page-head">
        <div>
          <h1>Koç Notları</h1>
          <p>Sadece senin göreceğin öğrenci takip notları</p>
        </div>
      </header>

      <div className="coach-notes-shell">
        <aside className="coach-notes-student-panel" aria-label="Öğrenci listesi">
          <label className="coach-notes-search">
            <span aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Öğrenci ara..."
            />
          </label>

          <div className="coach-notes-student-list">
            {filteredStudents.length === 0 ? (
              <div className="coach-notes-empty compact">
                Aramana uygun öğrenci bulunamadı.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = selectedStudent?.id === student.id;
                const noteCount = noteCountByStudent.get(student.id) ?? 0;
                return (
                  <button
                    key={student.id}
                    type="button"
                    className={`coach-notes-student-row${
                      isSelected ? " active" : ""
                    }`}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <UserAvatar name={student.name} size={30} />
                    <span className="coach-notes-student-copy">
                      <strong>{student.name}</strong>
                      <small>{formatStudentMeta(student, noteCount)}</small>
                    </span>
                    <i
                      className={`coach-notes-status-dot status-${student.status}`}
                      aria-label={student.statusLabel}
                    />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="coach-notes-workspace">
          {selectedStudent ? (
            <>
              <div className="coach-notes-selected-head">
                <div className="coach-notes-selected-main">
                  <UserAvatar name={selectedStudent.name} size={36} />
                  <div>
                    <h2>{selectedStudent.name}</h2>
                    <p>{formatStudentSubtitle(selectedStudent)}</p>
                  </div>
                </div>
              </div>

              <section className="coach-notes-composer" aria-label="Yeni koç notu">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Yeni not... (örn: Motivasyonu düştü, matematikte eksik var)"
                  spellCheck={false}
                />
                <div className="coach-notes-composer-bottom">
                  <button
                    type="button"
                    className="coach-notes-save-btn"
                    disabled={pending || !draft.trim()}
                    onClick={saveNote}
                  >
                    <span aria-hidden="true">✓</span>
                    Kaydet
                  </button>
                </div>
              </section>

              {visibleNotes.length === 0 ? (
                <div className="coach-notes-empty">
                  Bu öğrenci için henüz not eklenmedi.
                </div>
              ) : (
                <div className="coach-notes-history">
                  {visibleNotes.map((note) => {
                    const isEditing = editingId === note.id;
                    return (
                      <article key={note.id} className="coach-notes-history-card">
                        <div className="coach-notes-history-meta">
                          <time dateTime={note.updatedAt}>
                            {formatNoteDate(note.updatedAt)}
                          </time>
                        </div>
                        {isEditing ? (
                          <div className="coach-notes-edit">
                            <textarea
                              value={editingText}
                              onChange={(event) =>
                                setEditingText(event.target.value)
                              }
                              spellCheck={false}
                            />
                            <div className="coach-notes-edit-actions">
                              <button
                                type="button"
                                className="coach-notes-cancel-btn"
                                disabled={pending}
                                onClick={cancelEdit}
                              >
                                İptal
                              </button>
                              <button
                                type="button"
                                className="coach-notes-save-btn"
                                disabled={pending || !editingText.trim()}
                                onClick={() => saveEdit(note.id)}
                              >
                                <span aria-hidden="true">✓</span>
                                Kaydet
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p>{note.note}</p>
                        )}
                        <div className="coach-notes-menu-wrap">
                          <button
                            type="button"
                            className="coach-notes-card-menu"
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
                            <div className="coach-notes-menu">
                              <button
                                type="button"
                                className="coach-notes-menu-item"
                                disabled={pending}
                                onClick={() => startEdit(note)}
                              >
                                Düzenle
                              </button>
                              <button
                                type="button"
                                className="coach-notes-menu-item danger"
                                disabled={pending}
                                onClick={() => deleteNote(note.id)}
                              >
                                Sil
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="coach-notes-empty">
              Not eklemek için bir öğrenci seç.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function formatStudentMeta(student: CoachStudentRowDto, noteCount: number) {
  const noteLabel = noteCount === 0 ? "0 not" : `${noteCount} not`;
  const detail = formatStudentSubtitle(student);
  return detail ? `${detail} · ${noteLabel}` : noteLabel;
}

function formatStudentSubtitle(student: CoachStudentRowDto) {
  const grade = formatGrade(student.grade ?? student.schoolLevel);
  const track = student.track;
  return [grade, track].filter(Boolean).join(" - ");
}

function formatGrade(value: string | null | undefined) {
  if (!value) return "";
  const normalized = value.toLocaleLowerCase("tr-TR");
  if (normalized.includes("sınıf")) return value;
  return `${value}. Sınıf`;
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M7.1 12.2a5.1 5.1 0 1 0 0-10.2 5.1 5.1 0 0 0 0 10.2Zm3.7-1.1 3.1 3.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}
