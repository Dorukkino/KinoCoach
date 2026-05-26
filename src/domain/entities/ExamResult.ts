import { ExamScores } from "../value-objects/ExamScores";

export class ExamResult {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly date: Date,
    public readonly scores: ExamScores,
    public readonly note: string = ""
  ) {}

  total(): number {
    return this.scores.total();
  }
}
