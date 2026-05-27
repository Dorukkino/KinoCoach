import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateStudentInput,
  IStudentRepository,
} from "@/application/ports/IStudentRepository";
import { mapStudentRowWithEmail } from "../supabase/mappers";
import { mapAuthError } from "../auth/authErrors";

const STUDENT_COLUMNS =
  "id, user_id, name, task_completion_rate, last_active_at, grade, track";

const STUDENT_WITH_EMAIL_SELECT = `${STUDENT_COLUMNS}, users!inner(email)`;

export class SupabaseStudentRepository implements IStudentRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private resolveEmail(
    row: Record<string, unknown>,
    fallbackUserId: string
  ): string {
    const users = row.users as
      | { email?: string }
      | { email?: string }[]
      | null
      | undefined;
    const emailRow = Array.isArray(users) ? users[0] : users;
    const raw = String(emailRow?.email ?? "").trim();
    if (raw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return raw;
    return `unknown+${fallbackUserId}@placeholder.local`;
  }

  private mapRowWithJoin(row: Record<string, unknown>) {
    const userId = String(row.user_id);
    return mapStudentRowWithEmail(row, this.resolveEmail(row, userId));
  }

  private async emailsForUsers(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const { data } = await this.supabase
      .from("users")
      .select("id, email")
      .in("id", userIds);
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const raw = String(row.email ?? "").trim();
      const valid = raw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      map.set(
        String(row.id),
        valid ? raw : `unknown+${row.id}@placeholder.local`
      );
    }
    return map;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("students")
      .select(STUDENT_WITH_EMAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return this.mapRowWithJoin(data);
  }

  async findByUserId(userId: string) {
    const { data, error } = await this.supabase
      .from("students")
      .select(STUDENT_WITH_EMAIL_SELECT)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return this.mapRowWithJoin(data);
  }

  async findManyByIds(ids: string[]) {
    if (ids.length === 0) return [];
    const { data, error } = await this.supabase
      .from("students")
      .select(STUDENT_COLUMNS)
      .in("id", ids);
    if (error || !data) return [];
    const userIds = data.map((r) => String(r.user_id));
    const emails = await this.emailsForUsers(userIds);
    return data.map((row) =>
      mapStudentRowWithEmail(
        row,
        emails.get(String(row.user_id)) ??
          `unknown+${row.user_id}@placeholder.local`
      )
    );
  }

  async create(input: CreateStudentInput) {
    const { data, error } = await this.supabase
      .from("students")
      .insert({
        user_id: input.userId,
        name: input.name,
        grade: input.grade ?? null,
        track: input.track ?? null,
        task_completion_rate: 0,
      })
      .select(STUDENT_COLUMNS)
      .single();
    if (error) throw new Error(mapAuthError(error.message));
    return mapStudentRowWithEmail(data, input.email);
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      grade: string;
      track: string;
      taskCompletionRate: number;
    }>
  ) {
    const row: Record<string, unknown> = {};
    if (patch.name) row.name = patch.name;
    if (patch.grade) row.grade = patch.grade;
    if (patch.track) row.track = patch.track;
    if (patch.taskCompletionRate !== undefined) {
      row.task_completion_rate = patch.taskCompletionRate;
      row.last_active_at = new Date().toISOString();
    }
    const { data, error } = await this.supabase
      .from("students")
      .update(row)
      .eq("id", id)
      .select(STUDENT_WITH_EMAIL_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return this.mapRowWithJoin(data);
  }

  async touchLastActive(id: string) {
    const { error } = await this.supabase
      .from("students")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string) {
    const { error } = await this.supabase.from("students").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
