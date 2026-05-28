import { SupabaseClient } from "@supabase/supabase-js";
import {
  addDaysISO,
  getWeekStartForISO,
  getWeekStartISO,
  sortByDateNearToday,
  sortWeeksNearToday,
} from "@/lib/dates";

export interface QuestionSessionRecord {
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

export interface QuestionSessionCursor {
  date: string;
  createdAt: string;
  id: string;
}

export interface QuestionSessionPage {
  items: QuestionSessionRecord[];
  hasMore: boolean;
  nextCursor: QuestionSessionCursor | null;
}

const SESSION_COLUMNS =
  "id, student_id, lesson_name, date, total, correct, wrong, blank, note, created_at";

export class SupabaseQuestionSessionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private mapRow(r: Record<string, unknown>): QuestionSessionRecord {
    return {
      id: String(r.id),
      studentId: String(r.student_id),
      lessonName: String(r.lesson_name),
      date: String(r.date).slice(0, 10),
      total: Number(r.total),
      correct: Number(r.correct),
      wrong: Number(r.wrong),
      blank: Number(r.blank),
      note: String(r.note ?? ""),
    };
  }

  async findByStudentAndWeek(
    studentId: string,
    weekStart?: string,
    options?: { limit?: number; before?: QuestionSessionCursor }
  ): Promise<QuestionSessionPage> {
    const week = weekStart || getWeekStartISO();
    const weekEnd = addDaysISO(week, 6);
    const limit = options?.limit ?? 100;

    let query = this.supabase
      .from("question_sessions")
      .select(SESSION_COLUMNS)
      .eq("student_id", studentId)
      .gte("date", week)
      .lte("date", weekEnd)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (options?.before) {
      query = query.or(
        [
          `date.lt.${options.before.date}`,
          `and(date.eq.${options.before.date},created_at.lt.${options.before.createdAt})`,
          `and(date.eq.${options.before.date},created_at.eq.${options.before.createdAt},id.lt.${options.before.id})`,
        ].join(",")
      );
    }

    const { data, error } = await query;
    if (error || !data) {
      return { items: [], hasMore: false, nextCursor: null };
    }

    const hasMore = data.length > limit;
    const slice = hasMore ? data.slice(0, limit) : data;
    const items = sortByDateNearToday(
      slice.map((r) => ({
        ...this.mapRow(r),
        createdAt: String(r.created_at ?? ""),
      })),
      (s) => s.date,
      (s) => s.createdAt
    ).map(({ createdAt, ...rest }) => {
      void createdAt;
      return rest;
    });

    const oldest = slice[slice.length - 1];
    return {
      items,
      hasMore,
      nextCursor:
        hasMore && oldest
          ? {
              date: String(oldest.date).slice(0, 10),
              createdAt: String(oldest.created_at),
              id: String(oldest.id),
            }
          : null,
    };
  }

  async findWeeksByStudent(studentId: string): Promise<string[]> {
    const { data, error } = await this.supabase.rpc("get_question_session_weeks", {
      p_student_id: studentId,
    });
    if (error) return this.findWeeksFallback(studentId);

    const weeks = this.parseWeekRows(data);
    if (weeks.length === 0 && Array.isArray(data) && data.length > 0) {
      return this.findWeeksFallback(studentId);
    }
    return sortWeeksNearToday(weeks);
  }

  private parseWeekRows(data: unknown): string[] {
    if (!Array.isArray(data)) return [];
    const weeks: string[] = [];
    for (const row of data) {
      if (typeof row === "string") {
        const week = row.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(week)) weeks.push(week);
        continue;
      }
      if (row && typeof row === "object") {
        const week = String(
          (row as Record<string, unknown>).week_start ?? ""
        ).slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(week)) weeks.push(week);
      }
    }
    return weeks;
  }

  private async findWeeksFallback(studentId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("question_sessions")
      .select("date")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(500);
    if (error || !data) return [];

    const weeks = new Set<string>();
    for (const row of data) {
      const iso = String(row.date).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue;
      weeks.add(getWeekStartForISO(iso));
    }
    return sortWeeksNearToday([...weeks]);
  }

  async create(input: {
    engagementId: string;
    studentId: string;
    lessonName: string;
    date: string;
    total: number;
    correct: number;
    wrong: number;
    blank: number;
    note?: string;
  }) {
    const { data, error } = await this.supabase
      .from("question_sessions")
      .insert({
        engagement_id: input.engagementId,
        student_id: input.studentId,
        lesson_name: input.lessonName,
        date: input.date,
        total: input.total,
        correct: input.correct,
        wrong: input.wrong,
        blank: input.blank,
        note: input.note ?? "",
      })
      .select(SESSION_COLUMNS)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Kayıt eklenemedi");
    return this.mapRow(data);
  }

  async findStudentId(id: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("question_sessions")
      .select("student_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return String(data.student_id);
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from("question_sessions")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
