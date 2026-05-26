"use client";

import { useEffect, useState, useTransition } from "react";
import { getCoachNoteAction, upsertCoachNoteAction } from "@/app/actions/notes";

export function StudentNotesTab({ studentId }: { studentId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const n = await getCoachNoteAction(studentId);
      if (n) setNote(n.note);
    });
  }, [studentId]);

  const save = () => {
    startTransition(async () => {
      await upsertCoachNoteAction(studentId, note);
    });
  };

  return (
    <div className="panel p-4">
      <h3 className="font-semibold m-0 mb-2">Özel koç notları</h3>
      <p className="text-xs text-[var(--muted)] mb-3">Sadece koç görebilir</p>
      <textarea
        className="input min-h-[200px] resize-y"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button type="button" className="btn btn-primary mt-2" disabled={pending} onClick={save}>
        Kaydet
      </button>
    </div>
  );
}
