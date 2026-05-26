import { ExamResult } from "@/domain/entities/ExamResult";
import { ExamProgressService } from "@/domain/services/ExamProgressService";
import { SubjectKey } from "@/domain/value-objects/ExamScores";
import { ExamChartDto } from "../dto";

const SUBJECT_LABELS: Record<SubjectKey, string> = {
  turkish: "Türkçe",
  math: "Matematik",
  science: "Fen",
  social: "Sosyal",
  english: "İngilizce",
  total: "Toplam",
};

export class ChartDataService {
  private readonly examProgress = new ExamProgressService();

  buildChart(results: ExamResult[], subject: SubjectKey): ExamChartDto {
    return {
      subject,
      label: SUBJECT_LABELS[subject],
      points: this.examProgress.toLineChartSeries(results, subject),
    };
  }

  buildAllCharts(results: ExamResult[]): ExamChartDto[] {
    const subjects: SubjectKey[] = [
      "total",
      "turkish",
      "math",
      "science",
      "social",
      "english",
    ];
    return subjects.map((s) => this.buildChart(results, s));
  }
}
