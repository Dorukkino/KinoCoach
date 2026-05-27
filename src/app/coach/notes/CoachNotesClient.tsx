"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CoachNoteListItemDto } from "@/application/dto";
import type { CoachStudentRowDto } from "@/application/use-cases/ListActiveStudentsForCoachUseCase";
import { UserAvatar } from "@/presentation/components/ui/UserAvatar";

function truncateNote(note: string, max = 180) {
  const trimmed = note.trim();
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}...`;
}

export function CoachNotesClient({
  students,
  notes,
}: {
  students: CoachStudentRowDto[];
  notes: CoachNoteListItemDto[];
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? "all"
  );

  const visibleNotes = useMemo(() => {
    if (selectedStudentId === "all") return notes;
    return notes.filter((note) => note.studentId === selectedStudentId);
  }, [notes, selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <label className="label">Öğrenci seç</label>
        <select
          className="input mb-0"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          <option value="all">Tüm öğrenciler</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)] m-0">
          {selectedStudent
            ? `${selectedStudent.name} için ${visibleNotes.length} not`
            : `Tüm öğrencilerde ${visibleNotes.length} not`}
        </p>
        {selectedStudent && (
          <Link
            href={`/coach/students/${selectedStudent.id}?tab=notes`}
            className="btn btn-primary text-xs"
          >
            Bu öğrenciye not ekle
          </Link>
        )}
      </div>

      {visibleNotes.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-[var(--muted)]">
          {selectedStudent
            ? "Bu öğrenci için henüz not yok."
            : "Henüz koç notu eklenmedi."}
        </div>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {visibleNotes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/coach/students/${note.studentId}?tab=notes`}
                className="panel p-4 block hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar name={note.studentName} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-sm">
                        {note.studentName}
                      </span>
                      <span className="text-xs text-[var(--muted-2)] flex-shrink-0">
                        {new Date(note.updatedAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted)] m-0 mt-1.5 leading-snug whitespace-pre-wrap">
                      {truncateNote(note.note)}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
