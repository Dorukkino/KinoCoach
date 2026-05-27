"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getCoachNoteAction, upsertCoachNoteAction } from "@/app/actions/notes";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

export function StudentNotesTab({ studentId }: { studentId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      const n = await getCoachNoteAction(studentId);
      setNote(n?.note ?? "");
    });
  }, [studentId, startTransition]);

  useEffect(() => {
    load();
  }, [load]);

  useSupabaseTableRealtime({
    channelName: `coach-notes-${studentId}`,
    table: "coach_notes",
    filter: `student_id=eq.${studentId}`,
    pollIntervalMs: 5000,
    onChange: load,
  });

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
