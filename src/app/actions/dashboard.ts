"use server";

import { requireSession } from "./lib";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { getWeekStartDate } from "@/lib/dates";

/** Aktivite akışında gösterilecek en uzun yaşam süresi (gün) */
const ACTIVITY_MAX_AGE_DAYS = 2;

export interface ActivityItem {
  id: string;
  studentId: string;
  studentName: string;
  type: "exam" | "question_session";
  description: string;
  meta: string;
  note: string;
  timeAgo: string;
  createdAt: string;
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "az önce";
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

/** Koç adını admin client ile direkt users tablosundan çeker */
async function fetchCoachName(coachId: string): Promise<string> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", coachId)
      .maybeSingle();
    if (data?.full_name && data.full_name.trim()) return data.full_name.trim();
    if (data?.email) return data.email.split("@")[0];
  } catch {
    // ignore
  }
  return "Koçunuz";
}

export async function getCoachActivityFeedAction(): Promise<ActivityItem[]> {
  const { container, session } = await requireSession();
  if (!session.role.isCoach()) return [];

  const active = await container.engagements.findActiveByCoach(session.userId);
  if (active.length === 0) return [];

  const studentIds = active.map((e) => e.studentId);
  const students = await container.students.findManyByIds(studentIds);
  const studentMap = new Map(students.map((s) => [s.id, s.name]));
  const admin = createSupabaseAdminClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ACTIVITY_MAX_AGE_DAYS);
  const cutoffISO = cutoff.toISOString();

  const [{ data: exams }, { data: sessions }] = await Promise.all([
    admin
      .from("exam_results")
      .select("id, student_id, scores_json, exam_date, created_at")
      .in("student_id", studentIds)
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("question_sessions")
      .select("id, student_id, lesson_name, correct, total, note, date, created_at")
      .in("student_id", studentIds)
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const items: ActivityItem[] = [];

  for (const exam of exams ?? []) {
    const scores = (exam.scores_json ?? {}) as Record<string, number>;
    const totalNet =
      (scores.turkish ?? 0) +
      (scores.math ?? 0) +
      (scores.science ?? 0) +
      (scores.social ?? 0) +
      (scores.english ?? 0);
    items.push({
      id: `exam-${exam.id}`,
      studentId: String(exam.student_id),
      studentName: studentMap.get(String(exam.student_id)) ?? "Öğrenci",
      type: "exam",
      description: "deneme neti ekledi",
      meta: `Toplam: ${totalNet.toFixed(1)} net`,
      note: "",
      timeAgo: formatTimeAgo(String(exam.created_at)),
      createdAt: String(exam.created_at),
    });
  }

  for (const qs of sessions ?? []) {
    items.push({
      id: `qs-${qs.id}`,
      studentId: String(qs.student_id),
      studentName: studentMap.get(String(qs.student_id)) ?? "Öğrenci",
      type: "question_session",
      description: `${qs.lesson_name} soru çözdü`,
      meta: `${qs.correct}/${qs.total} doğru`,
      note: String(qs.note ?? ""),
      timeAgo: formatTimeAgo(String(qs.created_at)),
      createdAt: String(qs.created_at),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items.slice(0, 20);
}

export async function getCoachDashboardAction() {
  const { container, session } = await requireSession();
  if (!session.role.isCoach()) return null;

  // Tek seferde hem student rows hem activity feed için gerekli veriyi çek
  const active = await container.engagements.findActiveByCoach(session.userId);
  if (active.length === 0) {
    return {
      stats: container.dashboardStats.computeFromCards([]),
      students: [],
      activities: [] as ActivityItem[],
    };
  }

  const studentIds = active.map((e) => e.studentId);
  const rows = await container.listActiveStudents.execute(session.userId);

  // Activity feed — engagements ve students zaten çekildi, sadece exam/session sorgusu yap
  const students = await container.students.findManyByIds(studentIds);
  const studentMap = new Map(students.map((s) => [s.id, s.name]));
  const admin = createSupabaseAdminClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ACTIVITY_MAX_AGE_DAYS);
  const cutoffISO = cutoff.toISOString();

  const [{ data: exams }, { data: sessions }] = await Promise.all([
    admin
      .from("exam_results")
      .select("id, student_id, scores_json, exam_date, created_at")
      .in("student_id", studentIds)
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("question_sessions")
      .select("id, student_id, lesson_name, correct, total, note, date, created_at")
      .in("student_id", studentIds)
      .gte("created_at", cutoffISO)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const items: ActivityItem[] = [];

  for (const exam of exams ?? []) {
    const scores = (exam.scores_json ?? {}) as Record<string, number>;
    const totalNet =
      (scores.turkish ?? 0) +
      (scores.math ?? 0) +
      (scores.science ?? 0) +
      (scores.social ?? 0) +
      (scores.english ?? 0);
    items.push({
      id: `exam-${exam.id}`,
      studentId: String(exam.student_id),
      studentName: studentMap.get(String(exam.student_id)) ?? "Öğrenci",
      type: "exam",
      description: "deneme neti ekledi",
      meta: `Toplam: ${totalNet.toFixed(1)} net`,
      note: "",
      timeAgo: formatTimeAgo(String(exam.created_at)),
      createdAt: String(exam.created_at),
    });
  }

  for (const qs of sessions ?? []) {
    items.push({
      id: `qs-${qs.id}`,
      studentId: String(qs.student_id),
      studentName: studentMap.get(String(qs.student_id)) ?? "Öğrenci",
      type: "question_session",
      description: `${qs.lesson_name} soru çözdü`,
      meta: `${qs.correct}/${qs.total} doğru`,
      note: String(qs.note ?? ""),
      timeAgo: formatTimeAgo(String(qs.created_at)),
      createdAt: String(qs.created_at),
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    stats: container.dashboardStats.computeFromCards(rows),
    students: rows,
    activities: items.slice(0, 20),
  };
}

export async function getStudentDashboardAction() {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return null;

  const activeEngagement = await container.engagements.findActiveByStudent(
    student.id
  );

  if (!activeEngagement) {
    return {
      name: student.name,
      coachName: null,
      completionPercent: student.taskCompletionRate.percent,
      motivation: null,
      weeklyCompletion: 0,
      totalTasks: 0,
      completedTasks: 0,
      grid: [],
      hasActiveCoach: false,
    };
  }

  const coachName = await fetchCoachName(activeEngagement.coachId);
  const motivation = await container.getMotivation.execute(
    student.id,
    coachName
  );
  const program = await container.getWeeklyProgram.execute(
    student.id,
    getWeekStartDate(new Date())
  );

  const grid = program.grid as unknown[][];
  const allCells = grid.flat();
  const totalTasks = allCells.filter(Boolean).length;
  const completedTasks = allCells.filter(
    (c) => c && (c as { done?: boolean }).done
  ).length;

  return {
    name: student.name,
    coachName,
    completionPercent: student.taskCompletionRate.percent,
    motivation,
    weeklyCompletion: program.completionPercent,
    totalTasks,
    completedTasks,
    grid: program.grid,
    hasActiveCoach: true,
  };
}

export async function getCurrentStudentRecordAction() {
  const { container, session } = await requireSession();
  return container.students.findByUserId(session.userId);
}

export async function getCurrentStudentActiveEngagementAction() {
  const { container, session } = await requireSession();
  const student = await container.students.findByUserId(session.userId);
  if (!student) return null;
  return container.engagements.findActiveByStudent(student.id);
}
