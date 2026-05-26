import { IExamResultRepository } from "../ports/IExamResultRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { ExamScoresProps } from "@/domain/value-objects/ExamScores";
import { ExamResultDto } from "../dto";

export class UpdateExamResultUseCase {
  constructor(
    private readonly exams: IExamResultRepository,
    private readonly students: IStudentRepository
  ) {}

  async create(
    studentId: string,
    date: Date,
    scores: ExamScoresProps,
    note = ""
  ): Promise<ExamResultDto> {
    const result = await this.exams.create(studentId, date, scores, note);
    await this.students.touchLastActive(studentId);
    return this.toDto(result);
  }

  async update(
    id: string,
    scores: ExamScoresProps,
    date?: Date,
    note?: string
  ): Promise<ExamResultDto> {
    const result = await this.exams.update(id, scores, date, note);
    await this.students.touchLastActive(result.studentId);
    return this.toDto(result);
  }

  async delete(id: string): Promise<void> {
    await this.exams.delete(id);
  }

  private toDto(result: {
    id: string;
    studentId: string;
    date: Date;
    scores: { turkish: number; math: number; science: number; social: number; english?: number | null };
    note: string;
  }): ExamResultDto {
    const eng = result.scores.english ?? null;
    return {
      id: result.id,
      studentId: result.studentId,
      date: result.date.toISOString().slice(0, 10),
      turkish: result.scores.turkish,
      math: result.scores.math,
      science: result.scores.science,
      social: result.scores.social,
      english: eng,
      total: result.scores.turkish + result.scores.math + result.scores.science + result.scores.social + (eng ?? 0),
      note: result.note,
    };
  }
}
