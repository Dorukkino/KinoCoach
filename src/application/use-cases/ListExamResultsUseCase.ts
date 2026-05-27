import { IExamResultRepository } from "../ports/IExamResultRepository";
import { ExamResultDto } from "../dto";
import { sortByDateNearToday, toLocalDateISO } from "@/lib/dates";

export class ListExamResultsUseCase {
  constructor(private readonly exams: IExamResultRepository) {}

  async execute(studentId: string): Promise<ExamResultDto[]> {
    const results = await this.exams.findByStudentId(studentId);
    const dtos = results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      date: toLocalDateISO(r.date),
      turkish: r.scores.turkish,
      math: r.scores.math,
      science: r.scores.science,
      social: r.scores.social,
      english: r.scores.english,
      total: r.total(),
      note: r.note ?? "",
    }));
    return sortByDateNearToday(dtos, (r) => r.date);
  }
}
