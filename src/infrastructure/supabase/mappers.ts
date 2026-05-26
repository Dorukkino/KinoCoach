import { Student } from "@/domain/entities/Student";
import { Email } from "@/domain/value-objects/Email";
import { CompletionRate } from "@/domain/value-objects/CompletionRate";
import { WeeklyProgram } from "@/domain/entities/WeeklyProgram";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { ExamResult } from "@/domain/entities/ExamResult";
import { ExamScores } from "@/domain/value-objects/ExamScores";
import { Message } from "@/domain/entities/Message";
import { CoachNote } from "@/domain/entities/CoachNote";
import { MotivationMessage } from "@/domain/entities/MotivationMessage";
import { LessonNet } from "@/domain/entities/LessonNet";
import { Coach } from "@/domain/entities/Coach";
import { UserRole } from "@/domain/value-objects/UserRole";
import { UserProfile } from "@/application/ports/IUserRepository";
import { CoachingEngagement } from "@/domain/entities/CoachingEngagement";
import { EngagementStatus } from "@/domain/value-objects/EngagementStatus";
import {
  CoachingInvitation,
  InvitationStatus,
} from "@/domain/entities/CoachingInvitation";

function safeEmail(raw: unknown, userId: string): Email {
  const str = String(raw ?? "").trim();
  if (!str || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return Email.create(`unknown+${userId}@placeholder.local`);
  }
  return Email.create(str);
}

export function mapStudentRow(row: Record<string, unknown>): Student {
  return new Student(
    String(row.id),
    String(row.user_id),
    String(row.name),
    safeEmail(row.email, String(row.user_id)),
    CompletionRate.create(Number(row.task_completion_rate ?? 0)),
    row.last_active_at ? new Date(String(row.last_active_at)) : null,
    row.grade ? String(row.grade) : null,
    row.track ? String(row.track) : null
  );
}

export function mapStudentRowWithEmail(
  row: Record<string, unknown>,
  email: string
): Student {
  return new Student(
    String(row.id),
    String(row.user_id),
    String(row.name),
    Email.create(email),
    CompletionRate.create(Number(row.task_completion_rate ?? 0)),
    row.last_active_at ? new Date(String(row.last_active_at)) : null,
    row.grade ? String(row.grade) : null,
    row.track ? String(row.track) : null
  );
}

export function mapWeeklyProgramRow(row: Record<string, unknown>): WeeklyProgram {
  return new WeeklyProgram(
    String(row.id),
    String(row.student_id),
    new Date(String(row.week_start)),
    Grid7x10.fromJSON(row.grid_json),
    CompletionRate.create(Number(row.completion_rate ?? 0))
  );
}

export function mapExamResultRow(row: Record<string, unknown>): ExamResult {
  return new ExamResult(
    String(row.id),
    String(row.student_id),
    new Date(String(row.exam_date)),
    ExamScores.fromJSON(row.scores_json),
    String(row.note ?? "")
  );
}

export function mapMessageRow(row: Record<string, unknown>): Message {
  return new Message(
    String(row.id),
    String(row.sender_id),
    String(row.receiver_id),
    String(row.content ?? ""),
    new Date(String(row.created_at)),
    row.attachment_url ? String(row.attachment_url) : null
  );
}

export function mapCoachNoteRow(row: Record<string, unknown>): CoachNote {
  return new CoachNote(
    String(row.id),
    String(row.coach_id),
    String(row.student_id),
    String(row.note),
    new Date(String(row.updated_at))
  );
}

export function mapMotivationRow(row: Record<string, unknown>): MotivationMessage {
  return new MotivationMessage(
    String(row.id),
    String(row.coach_id),
    String(row.student_id),
    String(row.message),
    new Date(String(row.created_at))
  );
}

export function mapLessonNetRow(row: Record<string, unknown>): LessonNet {
  return new LessonNet(
    String(row.id),
    String(row.student_id),
    new Date(String(row.week_start)),
    Grid7x10.fromJSON(row.grid_json)
  );
}

export function mapCoachRow(row: Record<string, unknown>): Coach {
  const name =
    String(row.full_name ?? row.name ?? row.email ?? "Koç") || "Koç";
  const emailStr = String(row.email ?? `unknown+${row.id}@placeholder.local`);
  const email = (() => {
    try { return Email.create(emailStr); }
    catch { return Email.create(`unknown+${String(row.id)}@placeholder.local`); }
  })();
  return new Coach(String(row.id), name, email);
}

export function mapUserProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email),
    role: UserRole.from(String(row.role)),
    fullName: String(row.full_name),
  };
}

export function mapEngagementRow(
  row: Record<string, unknown>
): CoachingEngagement {
  return new CoachingEngagement(
    String(row.id),
    String(row.student_id),
    String(row.coach_id),
    EngagementStatus.from(String(row.status)),
    new Date(String(row.started_at)),
    row.ended_at ? new Date(String(row.ended_at)) : null,
    row.end_reason ? String(row.end_reason) : null,
    row.school_level ? String(row.school_level) : null,
    row.grade_at_start ? String(row.grade_at_start) : null,
    row.track ? String(row.track) : null
  );
}

export function mapInvitationRow(
  row: Record<string, unknown>
): CoachingInvitation {
  return new CoachingInvitation(
    String(row.id),
    String(row.student_id),
    String(row.coach_id),
    String(row.status) as InvitationStatus,
    String(row.token),
    new Date(String(row.expires_at)),
    new Date(String(row.created_at)),
    row.responded_at ? new Date(String(row.responded_at)) : null
  );
}
