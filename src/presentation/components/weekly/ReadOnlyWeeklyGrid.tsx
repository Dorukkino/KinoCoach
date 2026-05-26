"use client";

import React from "react";
import { GridMatrix } from "@/application/dto";
import { toneToHex } from "@/domain/value-objects/Grid7x10";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAY_LONG = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function cellStyle(tone: string, done: boolean): React.CSSProperties {
  const hex = toneToHex(tone);
  return {
    backgroundColor: hex + "22",
    borderLeft: `3px solid ${hex}`,
    opacity: done ? 0.55 : 1,
  };
}

export function ReadOnlyWeeklyGrid({ grid }: { grid: GridMatrix }) {
  return (
    <div className="weekly-grid" style={{ pointerEvents: "none", userSelect: "none" }}>
      {/* Köşe hücresi */}
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
              {cell && (
                <div className="w-full h-full text-left p-0.5">
                  <div className="font-medium text-xs leading-tight">{cell.title}</div>
                  {cell.sub && (
                    <div className="text-[10px] text-[var(--muted)] leading-tight mt-0.5">{cell.sub}</div>
                  )}
                  {cell.done && (
                    <div style={{ fontSize: 10, color: "var(--good-ink)", marginTop: 2, fontWeight: 600 }}>
                      ✓
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
