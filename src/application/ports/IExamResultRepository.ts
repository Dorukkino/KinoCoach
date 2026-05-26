import { ExamResult } from "@/domain/entities/ExamResult";
import { ExamScoresProps } from "@/domain/value-objects/ExamScores";

export interface IExamResultRepository {
  findByStudentId(studentId: string): Promise<ExamResult[]>;
  create(
    studentId: string,
    date: Date,
    scores: ExamScoresProps,
    note?: string
  ): Promise<ExamResult>;
  update(
    id: string,
    scores: ExamScoresProps,
    date?: Date,
    note?: string
  ): Promise<ExamResult>;
  delete(id: string): Promise<void>;
}
