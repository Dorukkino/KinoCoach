"use client";

import React from "react";
import { GridMatrix, TaskCell } from "@/application/dto";
import { toneToHex } from "@/domain/value-objects/Grid7x10";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_LONG = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

/** Hex rengi hafifletilmiş arka plan + koyu yazı rengine çevirir */
function cellStyle(tone: string, done: boolean): React.CSSProperties {
  const hex = toneToHex(tone);
  return {
    backgroundColor: hex + "22", // ~13% opacity
    borderLeft: `3px solid ${hex}`,
    opacity: done ? 0.6 : 1,
  };
}

export function WeeklyGrid({
  grid,
  role,
  onToggle,
  onEditCell,
  readOnly = false,
}: {
  grid: GridMatrix;
  role: "coach" | "student";
  onToggle?: (row: number, col: number) => void;
  onEditCell?: (row: number, col: number, cell: TaskCell | null) => void;
  readOnly?: boolean;
}) {
  const total = grid.flat().filter(Boolean).length;
  const done = grid.flat().filter((c) => c?.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 p-4 panel">
        <div>
          <span className="text-2xl font-bold">%{pct}</span>
          <span className="text-sm text-[var(--muted)] ml-2">
            {done} / {total} görev
          </span>
        </div>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="weekly-grid">
          <div className="wg-cell font-mono text-xs text-[var(--muted)]">#</div>
          {DAY_LONG.map((d, i) => (
            <div key={d} className="wg-cell font-semibold text-xs text-center bg-[var(--bg-elev)]">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{DAYS[i]}</span>
            </div>
          ))}
          {grid.map((row, r) => (
            <React.Fragment key={`row-${r}`}>
              <div className="wg-cell text-xs text-[var(--muted)] flex items-center justify-center">
                {r + 1}
              </div>
              {row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="wg-cell"
                  style={cell ? cellStyle(cell.tone, cell.done) : undefined}
                >
                  {cell ? (
                    <button
                      type="button"
                      className="w-full h-full text-left"
                      onClick={() => {
                        if (role === "student" && !readOnly) onToggle?.(r, c);
                        else if (role === "coach" && !readOnly) onEditCell?.(r, c, cell);
                      }}
                    >
                      <div className="font-medium text-xs">{cell.title}</div>
                      {cell.sub && (
                        <div className="text-[10px] text-[var(--muted)]">{cell.sub}</div>
                      )}
                      {role === "student" && (
                        <input
                          type="checkbox"
                          checked={cell.done}
                          disabled={readOnly}
                          onChange={() => {
                            if (!readOnly) onToggle?.(r, c);
                          }}
                          className={`weekly-task-checkbox ${readOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </button>
                  ) : role === "coach" && !readOnly ? (
                    <button
                      type="button"
                      className="w-full h-full text-[var(--muted-2)] text-xs"
                      onClick={() =>
                        onEditCell?.(r, c, {
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
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
