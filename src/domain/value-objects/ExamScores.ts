export interface ExamScoresProps {
  turkish: number;
  math: number;
  science: number;
  social: number;
  english?: number | null;
}

export class ExamScores {
  constructor(
    public readonly turkish: number,
    public readonly math: number,
    public readonly science: number,
    public readonly social: number,
    public readonly english: number | null = null
  ) {}

  static fromJSON(raw: unknown): ExamScores {
    const o = (raw ?? {}) as Record<string, number | null | undefined>;
    const eng = o.english;
    return new ExamScores(
      Number(o.turkish ?? 0),
      Number(o.math ?? 0),
      Number(o.science ?? 0),
      Number(o.social ?? 0),
      eng != null ? Number(eng) : null
    );
  }

  toJSON(): ExamScoresProps {
    const result: ExamScoresProps = {
      turkish: this.turkish,
      math: this.math,
      science: this.science,
      social: this.social,
    };
    if (this.english !== null) result.english = this.english;
    return result;
  }

  total(): number {
    return +(
      this.turkish +
      this.math +
      this.science +
      this.social +
      (this.english ?? 0)
    ).toFixed(2);
  }

  getBySubject(key: SubjectKey): number {
    if (key === "total") return this.total();
    if (key === "english") return this.english ?? 0;
    return this[key];
  }
}

export type SubjectKey = "turkish" | "math" | "science" | "social" | "english" | "total";
