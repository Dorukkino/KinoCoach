"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { getWeekStartISO, mergeWeeksNearToday, sortWeeksNearToday } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

interface PendingCell {
  row: number;
  col: number;
  existing: TaskCell | null;
}

export function StudentWeeklyTab({
  studentId,
  role,
  initialWeeks,
  initialProgram,
  initialSelectedWeek,
}: {
  studentId: string;
  role: "coach" | "student";
  initialWeeks?: string[];
  initialProgram?: WeeklyProgramDto | null;
  initialSelectedWeek?: string;
}) {
  const currentWeek = useMemo(() => getWeekStartISO(), []);
  const hasInitialWeeks = initialWeeks !== undefined;
  const skipInitialProgramFetch = useRef(initialProgram !== undefined);
  const [selectedWeek, setSelectedWeek] = useState<string>(
    initialSelectedWeek ?? currentWeek
  );
  const [weeks, setWeeks] = useState<string[]>(initialWeeks ?? [currentWeek]);
  const [program, setProgram] = useState<WeeklyProgramDto | null>(
    initialProgram ?? null
  );
  const [pending, setPending] = useState<PendingCell | null>(null);
  const [, startTransition] = useTransition();

  const loadWeeks = useCallback(async () => {
    const dbWeeks = await listWeeklyWeekStartsAction(studentId);
    setWeeks(mergeWeeksNearToday(currentWeek, dbWeeks));
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

  useEffect(() => {
    if (!hasInitialWeeks) void loadWeeks();
  }, [hasInitialWeeks, loadWeeks]);

  useEffect(() => {
    if (skipInitialProgramFetch.current) {
      skipInitialProgramFetch.current = false;
      return;
    }
    loadProgram(selectedWeek, true);
  }, [loadProgram, selectedWeek]);

  const refreshWeeklyProgram = useCallback(() => {
    void loadWeeks();
    loadProgram(selectedWeek);
  }, [loadProgram, loadWeeks, selectedWeek]);

  useSupabaseTableRealtime({
    channelName: `weekly-programs-${studentId}`,
    table: "weekly_programs",
    filter: `student_id=eq.${studentId}`,
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
        prev.includes(selectedWeek)
          ? prev
          : sortWeeksNearToday([selectedWeek, ...prev])
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

  const handleToggleCell = (row: number, col: number) => {
    if (!canToggle || !program) return;

    const previousProgram = program;
    const nextGrid = Grid7x10.fromJSON(program.grid).toggleDone(row, col).toJSON();
    setProgram({ ...program, grid: nextGrid });

    startTransition(async () => {
      try {
        const updated = await toggleWeeklyTaskAction(
          studentId,
          selectedWeek,
          row,
          col
        );
        setProgram(updated);
      } catch (error) {
        console.error("Failed to toggle weekly task", error);
        setProgram(previousProgram);
      }
    });
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
        <LoadingScreen className="panel" />
      ) : (
        <WeeklyGrid
          grid={program.grid}
          role={role}
          readOnly={isPastWeek}
          onEditCell={canEdit ? handleEditCell : undefined}
          onToggle={canToggle ? handleToggleCell : undefined}
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
