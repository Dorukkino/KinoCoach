export interface QuestionSessionDto {
  id: string;
  studentId: string;
  lessonName: string;
  date: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  note: string;
}

export type CreateQuestionSessionResult =
  | { ok: true; session: QuestionSessionDto }
  | { ok: false; error: string };
