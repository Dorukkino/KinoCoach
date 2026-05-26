import { SupabaseClient } from "@supabase/supabase-js";
import { IExamResultRepository } from "@/application/ports/IExamResultRepository";
import { ExamScoresProps } from "@/domain/value-objects/ExamScores";
import { mapExamResultRow } from "../supabase/mappers";

export class SupabaseExamResultRepository implements IExamResultRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByStudentId(studentId: string) {
    const { data, error } = await this.supabase
      .from("exam_results")
      .select("*")
      .eq("student_id", studentId)
      .order("exam_date", { ascending: false })
      .order("created_at", { ascending: false });
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
      .select()
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
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapExamResultRow(data);
  }

  async delete(id: string) {
    const { error } = await this.supabase.from("exam_results").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
