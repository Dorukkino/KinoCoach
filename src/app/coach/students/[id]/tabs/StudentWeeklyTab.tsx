"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
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
import { Grid7x10, TaskCell, toneToHex } from "@/domain/value-objects/Grid7x10";
import { getWeekStartISO, mergeWeeksNearToday, sortWeeksNearToday } from "@/lib/dates";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import { LoadingScreen } from "@/presentation/components/ui/LoadingScreen";

interface PendingCell {
  row: number;
  col: number;
  existing: TaskCell | null;
}

const DETAIL_DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const STUDENT_PROGRAM_DAYS = DETAIL_DAYS;

function detailCellStyle(cell: TaskCell): CSSProperties {
  return {
    borderLeft: `3px solid ${toneToHex(cell.tone)}`,
    opacity: cell.done ? 0.62 : 1,
  };
}

function studentTaskStyle(cell: TaskCell): CSSProperties {
  const hex = toneToHex(cell.tone);
  return {
    backgroundColor: `${hex}0d`,
    borderLeftColor: hex,
  };
}

export function StudentWeeklyTab({
  studentId,
  role,
  initialWeeks,
  initialProgram,
  initialSelectedWeek,
  detailVariant = false,
}: {
  studentId: string;
  role: "coach" | "student";
  initialWeeks?: string[];
  initialProgram?: WeeklyProgramDto | null;
  initialSelectedWeek?: string;
  detailVariant?: boolean;
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
    debounceMs: 0,
    pollIntervalMs: 10000,
    onChange: refreshWeeklyProgram,
  });

  const isPastWeek = selectedWeek < currentWeek;
  const canEdit = role === "coach" && !isPastWeek;
  const canToggle = role === "student" && !isPastWeek;
  const previousWeek = weeks.find((week) => week < currentWeek);
  const programStats = useMemo(() => {
    if (!program) return null;
    const total = program.grid.flat().filter(Boolean).length;
    const done = program.grid.flat().filter((cell) => cell?.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [program]);

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
      {role === "student" && !detailVariant ? (
        <div className="student-program-head">
          <div className="student-program-title">
            <h1>Haftalık Program</h1>
          </div>

          <div className="student-program-actions">
            <WeekPicker
              weeks={weeks}
              selectedWeek={selectedWeek}
              currentWeek={currentWeek}
              onSelect={setSelectedWeek}
            />
            <button
              type="button"
              className="student-program-history"
              disabled={!previousWeek}
              onClick={() => {
                if (previousWeek) setSelectedWeek(previousWeek);
              }}
            >
              Geçmiş haftalar
            </button>
          </div>
        </div>
      ) : (
        <div
          className={
            detailVariant
              ? "student-weekly-toolbar"
              : "flex items-center justify-between gap-3 mb-4 flex-wrap"
          }
        >
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
      )}

      {!program ? (
        <LoadingScreen className="panel" />
      ) : detailVariant ? (
        <CoachDetailWeeklyGrid
          grid={program.grid}
          readOnly={isPastWeek}
          onEditCell={canEdit ? handleEditCell : undefined}
        />
      ) : role === "student" ? (
        <StudentProgramGrid
          grid={program.grid}
          readOnly={isPastWeek}
          completionPercent={programStats?.pct ?? program.completionPercent}
          onToggle={canToggle ? handleToggleCell : undefined}
        />
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

function StudentProgramGrid({
  grid,
  readOnly,
  completionPercent,
  onToggle,
}: {
  grid: WeeklyProgramDto["grid"];
  readOnly: boolean;
  completionPercent: number;
  onToggle?: (row: number, col: number) => void;
}) {
  const total = grid.flat().filter(Boolean).length;
  const done = grid.flat().filter((cell) => cell?.done).length;

  return (
    <section className="student-program-shell" aria-label="Haftalık program tablosu">
      <div className="student-program-progress">
        <div className="student-program-progress-copy">
          <strong>%{completionPercent}</strong>
          <span>{done} / {total} görev tamamlandı</span>
        </div>
        <div
          className="student-program-progress-track"
          aria-label={`Haftalık program tamamlanma oranı yüzde ${completionPercent}`}
        >
          <span style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      {readOnly && (
        <p className="student-program-readonly">
          Geçmiş hafta - yalnızca görüntüleme
        </p>
      )}

      <div className="student-program-scroll">
        <div className="student-program-grid">
          <div className="student-program-corner">#</div>
          {STUDENT_PROGRAM_DAYS.map((day) => (
            <div key={day} className="student-program-day">
              {day}
            </div>
          ))}

          {grid.map((row, rowIndex) => (
            <Fragment key={`student-program-row-${rowIndex}`}>
              <div className="student-program-row-number">{rowIndex + 1}</div>
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`student-program-cell${cell ? " has-task" : ""}${cell?.done ? " is-done" : ""}`}
                >
                  {cell ? (
                    <button
                      type="button"
                      className="student-program-task"
                      style={studentTaskStyle(cell)}
                      disabled={readOnly}
                      aria-pressed={cell.done}
                      onClick={() => onToggle?.(rowIndex, colIndex)}
                    >
                      <span
                        className="student-program-check"
                        aria-hidden="true"
                      >
                        {cell.done ? "✓" : ""}
                      </span>
                      <span className="student-program-task-title">
                        {cell.title}
                      </span>
                      {cell.sub && (
                        <span className="student-program-task-sub">
                          {cell.sub}
                        </span>
                      )}
                    </button>
                  ) : null}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoachDetailWeeklyGrid({
  grid,
  readOnly,
  onEditCell,
}: {
  grid: WeeklyProgramDto["grid"];
  readOnly: boolean;
  onEditCell?: (row: number, col: number, cell: TaskCell | null) => void;
}) {
  const total = grid.flat().filter(Boolean).length;
  const done = grid.flat().filter((cell) => cell?.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="coach-detail-weekly">
      <div className="coach-detail-weekly-progress">
        <div>
          <span className="coach-detail-weekly-pct">%{pct}</span>
          <span className="coach-detail-weekly-count">
            {done} / {total} görev
          </span>
        </div>
        <div className="coach-detail-weekly-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="coach-detail-weekly-scroll">
        <div className="weekly-grid weekly-grid-detail">
          <div className="wg-detail-corner">#</div>
          {DETAIL_DAYS.map((day) => (
            <div key={day} className="wg-detail-head">
              {day}
            </div>
          ))}

          {grid.map((row, rowIndex) => (
            <div className="contents" key={`detail-row-${rowIndex}`}>
              <div className="wg-detail-row-num">{rowIndex + 1}</div>
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`wg-cell wg-detail-cell${cell ? " filled" : ""}${
                    cell?.done ? " done" : ""
                  }`}
                  style={cell ? detailCellStyle(cell) : undefined}
                >
                  {cell ? (
                    <button
                      type="button"
                      className="wg-detail-task"
                      onClick={() => {
                        if (!readOnly) onEditCell?.(rowIndex, colIndex, cell);
                      }}
                    >
                      <div className="wg-detail-title">{cell.title}</div>
                      {cell.sub && (
                        <div className="wg-detail-sub">{cell.sub}</div>
                      )}
                    </button>
                  ) : !readOnly ? (
                    <button
                      type="button"
                      className="wg-detail-empty"
                      onClick={() =>
                        onEditCell?.(rowIndex, colIndex, {
                          title: "",
                          sub: "",
                          tone: "#0d9488",
                          done: false,
                        })
                      }
                    >
                      +
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
