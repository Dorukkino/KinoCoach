import { SupabaseClient } from "@supabase/supabase-js";
import { IExamResultRepository } from "@/application/ports/IExamResultRepository";
import { ExamScoresProps } from "@/domain/value-objects/ExamScores";
import { mapExamResultRow } from "../supabase/mappers";

const EXAM_RESULT_COLUMNS =
  "id, student_id, exam_date, scores_json, note, created_at";

export class SupabaseExamResultRepository implements IExamResultRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("exam_results")
      .select(EXAM_RESULT_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapExamResultRow(data);
  }

  async findByStudentId(studentId: string, limit = 100) {
    const { data, error } = await this.supabase
      .from("exam_results")
      .select("id, student_id, exam_date, scores_json, note, created_at")
      .eq("student_id", studentId)
      .order("exam_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return [...data]
      .sort((a, b) => {
        const byDate = String(b.exam_date).localeCompare(String(a.exam_date));
        if (byDate !== 0) return byDate;
        return String(b.created_at).localeCompare(String(a.created_at));
      })
      .map(mapExamResultRow);
  }

  async create(studentId: string, date: Date, scores: ExamScoresProps, note = "") {
    const { data, error } = await this.supabase
      .from("exam_results")
      .insert({
        student_id: studentId,
        exam_date: date.toISOString().slice(0, 10),
        scores_json: scores,
        note,
      })
      .select(EXAM_RESULT_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapExamResultRow(data);
  }

  async update(id: string, scores: ExamScoresProps, date?: Date, note?: string) {
    const patch: Record<string, unknown> = { scores_json: scores };
    if (date) patch.exam_date = date.toISOString().slice(0, 10);
    if (note !== undefined) patch.note = note;
    const { data, error } = await this.supabase
      .from("exam_results")
      .update(patch)
      .eq("id", id)
      .select(EXAM_RESULT_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapExamResultRow(data);
  }

  async delete(id: string) {
    const { error } = await this.supabase.from("exam_results").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
