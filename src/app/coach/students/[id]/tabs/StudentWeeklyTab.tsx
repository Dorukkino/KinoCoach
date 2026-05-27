"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { WeeklyGrid } from "@/presentation/components/weekly/WeeklyGrid";
import { CellPickerModal } from "@/presentation/components/weekly/CellPickerModal";
import { WeekPicker } from "@/presentation/components/weekly/WeekPicker";
import {
  getWeeklyProgramAction,
  listWeeklyWeekStartsAction,
  saveWeeklyProgramAction,
  toggleWeeklyTaskAction,
} from "@/app/actions/weekly";
import { WeeklyProgramDto } from "@/application/dto";
import { Grid7x10, TaskCell } from "@/domain/value-objects/Grid7x10";
import { getWeekStartISO } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";

interface PendingCell {
  row: number;
  col: number;
  existing: TaskCell | null;
}

export function StudentWeeklyTab({
  studentId,
  role,
}: {
  studentId: string;
  role: "coach" | "student";
}) {
  const currentWeek = useMemo(() => getWeekStartISO(), []);
  const [selectedWeek, setSelectedWeek] = useState<string>(currentWeek);
  const [weeks, setWeeks] = useState<string[]>([currentWeek]);
  const [program, setProgram] = useState<WeeklyProgramDto | null>(null);
  const [pending, setPending] = useState<PendingCell | null>(null);
  const [, startTransition] = useTransition();

  const loadWeeks = useCallback(async () => {
    const dbWeeks = await listWeeklyWeekStartsAction(studentId);
    const merged = Array.from(new Set([currentWeek, ...dbWeeks])).sort((a, b) =>
      a < b ? 1 : a > b ? -1 : 0
    );
    setWeeks(merged);
  }, [currentWeek, studentId]);

  const loadProgram = useCallback(
    (weekStart: string, clear = false) => {
      if (clear) setProgram(null);
      startTransition(async () => {
        const p = await getWeeklyProgramAction(studentId, weekStart);
        setProgram(p);
      });
    },
    [studentId, startTransition]
  );

  // Hafta listesini bir kere yükle ve güncel haftayı da listeye dahil et.
  useEffect(() => {
    void loadWeeks();
  }, [loadWeeks]);

  // Seçili hafta değiştiğinde programı yükle.
  useEffect(() => {
    loadProgram(selectedWeek, true);
  }, [loadProgram, selectedWeek]);

  const refreshWeeklyProgram = useCallback(() => {
    void loadWeeks();
    loadProgram(selectedWeek);
  }, [loadProgram, loadWeeks, selectedWeek]);

  useSupabaseTableRealtime({
    channelName: `weekly-programs-${studentId}`,
    table: "weekly_programs",
    pollIntervalMs: role === "student" ? 3000 : undefined,
    onChange: refreshWeeklyProgram,
  });

  const isPastWeek = selectedWeek < currentWeek;
  const canEdit = role === "coach" && !isPastWeek;
  const canToggle = role === "student" && !isPastWeek;

  const saveGrid = (grid: WeeklyProgramDto["grid"]) => {
    startTransition(async () => {
      const updated = await saveWeeklyProgramAction(
        studentId,
        selectedWeek,
        grid
      );
      setProgram(updated);
      // Yeni hafta oluşturulmuş olabilir; listeye ekle.
      setWeeks((prev) =>
        prev.includes(selectedWeek) ? prev : [selectedWeek, ...prev].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
      );
    });
  };

  const handleEditCell = (row: number, col: number, cell: TaskCell | null) => {
    if (!canEdit) return;
    setPending({ row, col, existing: cell?.title ? cell : null });
  };

  const handleModalSave = (cell: TaskCell | null) => {
    if (!pending || !program) return;
    const g = Grid7x10.fromJSON(program.grid);
    const next = g.setCell(pending.row, pending.col, cell);
    setPending(null);
    saveGrid(next.toJSON());
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <WeekPicker
          weeks={weeks}
          selectedWeek={selectedWeek}
          currentWeek={currentWeek}
          onSelect={setSelectedWeek}
        />
        {isPastWeek && (
          <span className="text-xs text-[var(--muted)] italic">
            Geçmiş hafta — yalnızca görüntüleme
          </span>
        )}
      </div>

      {!program ? (
        <p className="text-sm text-[var(--muted)]">Yükleniyor…</p>
      ) : (
        <WeeklyGrid
          grid={program.grid}
          role={role}
          readOnly={isPastWeek}
          onEditCell={canEdit ? handleEditCell : undefined}
          onToggle={
            canToggle
              ? (row, col) => {
                  startTransition(async () => {
                    const updated = await toggleWeeklyTaskAction(
                      studentId,
                      selectedWeek,
                      row,
                      col
                    );
                    setProgram(updated);
                  });
                }
              : undefined
          }
        />
      )}

      {pending && (
        <CellPickerModal
          row={pending.row}
          col={pending.col}
          existing={pending.existing}
          onSave={handleModalSave}
          onClose={() => setPending(null)}
        />
      )}
    </>
  );
}
