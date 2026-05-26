import { StudentStatusValue } from "@/domain/value-objects/StudentStatus";
import { SubjectKey } from "@/domain/value-objects/ExamScores";
import { GridMatrix, TaskCell } from "@/domain/value-objects/Grid7x10";

export interface StudentCardDto {
  id: string;
  userId?: string;
  name: string;
  email: string;
  completionPercent: number;
  status: StudentStatusValue;
  statusLabel: string;
  lastActive: string | null;
  grade: string | null;
  track: string | null;
}

export interface StudentDetailDto extends StudentCardDto {
  userId: string;
  /** @deprecated Aktif engagement varsa engagement.coachId üzerinden okuyun. */
  coachId: string | null;
  /** Aktif koçluk ilişkisinin id'si; yoksa null. */
  activeEngagementId: string | null;
  school?: string | null;
}

export interface EngagementSummaryDto {
  id: string;
  studentId: string;
  coachId: string;
  status: "active" | "ended" | "paused";
  startedAt: string;
  endedAt: string | null;
  endReason: string | null;
  schoolLevel: string | null;
  gradeAtStart: string | null;
  track: string | null;
}

export interface CoachingInvitationDto {
  id: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  status: "pending" | "accepted" | "declined" | "expired";
  /** Yanıt akışında kullanılır; sadece daveti gören öğrenciye iletilir. */
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface WeeklyProgramDto {
  id: string;
  studentId: string;
  weekStart: string;
  grid: GridMatrix;
  completionPercent: number;
}

export interface ExamResultDto {
  id: string;
  studentId: string;
  date: string;
  turkish: number;
  math: number;
  science: number;
  social: number;
  english?: number | null;
  total: number;
  note: string;
}

export interface ExamChartDto {
  subject: SubjectKey;
  label: string;
  points: { date: string; value: number }[];
}

export interface MessageDto {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  attachmentUrl: string | null;
  isMine: boolean;
}

export interface CoachNoteDto {
  id: string;
  studentId: string;
  note: string;
  updatedAt: string;
}

export interface CoachNoteListItemDto {
  studentId: string;
  studentName: string;
  note: string;
  updatedAt: string | null;
}

export interface MotivationCardDto {
  message: string;
  coachName: string;
  createdAt: string;
}

export interface LessonNetDto {
  id: string;
  studentId: string;
  weekStart: string;
  grid: GridMatrix;
}

export interface DashboardStatsDto {
  totalStudents: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  avgCompletion: number;
}

export interface ChatThreadDto {
  studentId: string;
  studentName: string;
  lastMessage: string | null;
  unreadCount: number;
}

export type { TaskCell, GridMatrix };
