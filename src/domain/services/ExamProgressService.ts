import { ExamResult } from "../entities/ExamResult";
import { SubjectKey } from "../value-objects/ExamScores";

export interface ChartPoint {
  date: string;
  value: number;
}

export class ExamProgressService {
  toLineChartSeries(results: ExamResult[], subject: SubjectKey): ChartPoint[] {
    const sorted = [...results].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    return sorted.map((r) => ({
      date: r.date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      }),
      value: r.scores.getBySubject(subject),
    }));
  }
}
