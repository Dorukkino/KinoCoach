"use client";

import { useEffect, useRef, useState } from "react";
import { formatWeekRange } from "@/lib/dates";

export function WeekPicker({
  weeks,
  selectedWeek,
  currentWeek,
  onSelect,
}: {
  /** YYYY-MM-DD hafta başlangıçları, bugüne en yakın önce */
  weeks: string[];
  selectedWeek: string;
  /** Bu haftanın başlangıcı (etiketlemek için) */
  currentWeek: string;
  onSelect: (week: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const label = formatWeekRange(selectedWeek);
  const isCurrent = selectedWeek === currentWeek;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--bg)] transition-colors text-sm font-medium"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{label}</span>
        {isCurrent && (
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold">
            Bu hafta
          </span>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 min-w-[260px] max-h-[320px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-lg"
        >
          {weeks.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--muted)]">
              Henüz hafta yok.
            </div>
          ) : (
            weeks.map((w) => {
              const isActive = w === selectedWeek;
              const isThisWeek = w === currentWeek;
              return (
                <button
                  type="button"
                  key={w}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onSelect(w);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                    isActive
                      ? "bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold"
                      : "hover:bg-[var(--bg)]"
                  }`}
                >
                  <span>{formatWeekRange(w)}</span>
                  {isThisWeek && (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-ink)] font-semibold">
                      Bu hafta
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
