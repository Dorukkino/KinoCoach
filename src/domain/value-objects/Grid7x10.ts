/** Hex renk kodu veya eski tone adı — her ikisi de kabul edilir */
export type TaskTone = string;

export interface TaskCell {
  title: string;
  sub: string;
  tone: TaskTone;
  done: boolean;
}

/** Eski tone adlarını hex'e çevirir, zaten hex ise olduğu gibi döner */
export function toneToHex(tone: TaskTone): string {
  const map: Record<string, string> = {
    teal:   "#0d9488",
    amber:  "#d97706",
    rose:   "#e11d48",
    green:  "#16a34a",
    mint:   "#059669",
    indigo: "#4f46e5",
    sand:   "#92400e",
  };
  return map[tone] ?? tone;
}

export type GridRow = (TaskCell | null)[];
export type GridMatrix = GridRow[];

const ROWS = 10;
const COLS = 7;

export class Grid7x10 {
  private constructor(public readonly cells: GridMatrix) {}

  static empty(): Grid7x10 {
    const cells: GridMatrix = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => null)
    );
    return new Grid7x10(cells);
  }

  static fromJSON(raw: unknown): Grid7x10 {
    if (!Array.isArray(raw) || raw.length !== ROWS) {
      return Grid7x10.empty();
    }
    const cells = raw.map((row) => {
      if (!Array.isArray(row) || row.length !== COLS) {
        return Array.from({ length: COLS }, () => null);
      }
      return row.map((cell) => {
        if (!cell || typeof cell !== "object") return null;
        const c = cell as Record<string, unknown>;
        if (!c.title || typeof c.title !== "string") return null;
        return {
          title: c.title,
          sub: String(c.sub ?? ""),
          tone: (c.tone as TaskTone) ?? "teal",
          done: Boolean(c.done),
        } satisfies TaskCell;
      });
    });
    return new Grid7x10(cells);
  }

  toJSON(): GridMatrix {
    return this.cells;
  }

  toggleDone(row: number, col: number): Grid7x10 {
    const next = this.cells.map((r) => r.slice());
    const cell = next[row]?.[col];
    if (!cell) return this;
    next[row][col] = { ...cell, done: !cell.done };
    return new Grid7x10(next);
  }

  setCell(row: number, col: number, cell: TaskCell | null): Grid7x10 {
    const next = this.cells.map((r) => r.slice());
    if (!next[row]) return this;
    next[row][col] = cell;
    return new Grid7x10(next);
  }

  totalTasks(): number {
    return this.cells.flat().filter(Boolean).length;
  }

  completedTasks(): number {
    return this.cells.flat().filter((c) => c?.done).length;
  }
}
