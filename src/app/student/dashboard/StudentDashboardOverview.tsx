"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { getStudentMotivationAction } from "@/app/actions/dashboard";
import { listExamResultsAction } from "@/app/actions/exams";
import { listQuestionSessionsAction } from "@/app/actions/question-sessions";
import type { QuestionSessionDto } from "@/app/actions/question-sessions";
import { getWeeklyProgramAction } from "@/app/actions/weekly";
import type {
  ExamResultDto,
  MotivationCardDto,
  WeeklyProgramDto,
} from "@/application/dto";
import type { GridMatrix, TaskCell } from "@/domain/value-objects/Grid7x10";
import { formatTRDate, todayLocalISO } from "@/lib/dates";
import { ExamLineChart } from "@/presentation/components/charts/ExamLineChart";
import { useSupabaseTableRealtime } from "@/presentation/hooks/useSupabaseTableRealtime";
import type { StudentDashboardData } from "./StudentDashboardContent";

const DAYS = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

type TodayTask = TaskCell & {
  row: number;
  col: number;
};

function getDayIndex(iso = todayLocalISO()) {
  const date = new Date(`${iso}T12:00:00+03:00`);
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function flattenTasks(grid: GridMatrix): TodayTask[] {
  return grid.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) =>
      cell ? [{ ...cell, row: rowIndex, col: colIndex }] : []
    )
  );
}

function calculateNet(correct: number, wrong: number) {
  return correct - wrong / 4;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatRelativeTime(iso: string) {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "az önce";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function StudentDashboardOverview({
  dashboard,
  initialProgram,
  initialExamRows,
  initialQuestionSessions,
  weekStart,
}: {
  dashboard: StudentDashboardData;
  initialProgram: WeeklyProgramDto | null;
  initialExamRows: ExamResultDto[];
  initialQuestionSessions: QuestionSessionDto[];
  weekStart: string;
}) {
  const [program, setProgram] = useState(initialProgram);
  const [exams, setExams] = useState(initialExamRows);
  const [questionSessions, setQuestionSessions] = useState(initialQuestionSessions);
  const [motivation, setMotivation] = useState<MotivationCardDto | null>(
    dashboard.motivation
  );
  const [, startTransition] = useTransition();

  useEffect(() => {
    setProgram(initialProgram);
  }, [initialProgram]);

  useEffect(() => {
    setMotivation(dashboard.motivation);
  }, [dashboard.motivation]);

  const loadProgram = useCallback(() => {
    startTransition(async () => {
      setProgram(await getWeeklyProgramAction(dashboard.studentId, weekStart));
    });
  }, [dashboard.studentId, weekStart, startTransition]);

  const loadExams = useCallback(() => {
    startTransition(async () => {
      setExams(await listExamResultsAction(dashboard.studentId));
    });
  }, [dashboard.studentId, startTransition]);

  const loadQuestionSessions = useCallback(() => {
    startTransition(async () => {
      setQuestionSessions(
        await listQuestionSessionsAction(dashboard.studentId, weekStart)
      );
    });
  }, [dashboard.studentId, weekStart, startTransition]);

  const loadMotivation = useCallback(() => {
    startTransition(async () => {
      setMotivation(await getStudentMotivationAction());
    });
  }, [startTransition]);

  useSupabaseTableRealtime({
    channelName: `student-dashboard-weekly-${dashboard.studentId}`,
    table: "weekly_programs",
    filter: `student_id=eq.${dashboard.studentId}`,
    debounceMs: 300,
    pollIntervalMs: 10000,
    onChange: loadProgram,
  });

  useSupabaseTableRealtime({
    channelName: `student-dashboard-exams-${dashboard.studentId}`,
    table: "exam_results",
    filter: `student_id=eq.${dashboard.studentId}`,
    debounceMs: 500,
    onChange: loadExams,
  });

  useSupabaseTableRealtime({
    channelName: `student-dashboard-questions-${dashboard.studentId}`,
    table: "question_sessions",
    filter: `student_id=eq.${dashboard.studentId}`,
    debounceMs: 500,
    onChange: loadQuestionSessions,
  });

  useSupabaseTableRealtime({
    channelName: `student-dashboard-motivation-${dashboard.studentId}`,
    table: "motivation_messages",
    filter: `student_id=eq.${dashboard.studentId}`,
    debounceMs: 300,
    onChange: loadMotivation,
  });

  const todayIndex = getDayIndex();
  const allTasks = useMemo(
    () => (program ? flattenTasks(program.grid) : []),
    [program]
  );
  const todayTasks = useMemo(
    () => allTasks.filter((task) => task.col === todayIndex),
    [allTasks, todayIndex]
  );
  const completedToday = todayTasks.filter((task) => task.done).length;
  const completedWeek = allTasks.filter((task) => task.done).length;
  const todayPercent = todayTasks.length
    ? Math.round((completedToday / todayTasks.length) * 100)
    : 0;
  const weekPercent = allTasks.length
    ? Math.round((completedWeek / allTasks.length) * 100)
    : 0;

  const questionNet = questionSessions.reduce(
    (total, session) => total + calculateNet(session.correct, session.wrong),
    0
  );

  const sortedExams = useMemo(
    () => [...exams].sort((a, b) => a.date.localeCompare(b.date)),
    [exams]
  );
  const latestExam = sortedExams.at(-1) ?? null;
  const totalChartData = sortedExams.map((exam) => ({
    date: formatTRDate(exam.date),
    value: exam.total,
  }));
  const firstName = dashboard.name.split(" ")[0] || dashboard.name;
  const coachName = motivation?.coachName ?? dashboard.coachName ?? "Koçun";
  const dateLabel = `${DAYS[todayIndex]} · ${formatTRDate(todayLocalISO())}`;

  return (
    <div className="student-overview">
      <div className="student-overview-greeting-row">
        <div className="student-overview-greeting">
          <h1>Merhaba {firstName},</h1>
          <p>
            Mevcut koçun:{" "}
            <strong>{dashboard.coachName ?? "Henüz aktif bir koçun yok"}</strong>
          </p>
        </div>
        <span className="student-overview-date-pill">
          <span />
          {dateLabel}
        </span>
      </div>

      {motivation && (
        <section className="student-overview-motivation-card">
          <div className="student-overview-motiv-side">
            <span className="student-overview-avatar">
              {coachName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "K"}
            </span>
            <div>
              <strong>{coachName} koçundan mesaj var</strong>
              <small>{formatRelativeTime(motivation.createdAt)}</small>
            </div>
          </div>
          <q>{motivation.message}</q>
        </section>
      )}

      <section className="student-overview-stats" aria-label="Öğrenci özeti">
        <StatCard
          label="Bugünkü görevler"
          value={String(completedToday)}
          unit={`/ ${todayTasks.length}`}
          tone="teal"
          delta={`${todayPercent}%`}
          sub="tamamlandı"
          icon="check"
        />
        <StatCard
          label="Bu hafta görev"
          value={String(completedWeek)}
          unit={`/ ${allTasks.length}`}
          tone="green"
          delta={`${weekPercent}%`}
          sub="haftalık ilerleme"
          icon="trend"
        />
        <StatCard
          label="Son Deneme Neti"
          value={latestExam ? formatNumber(latestExam.total) : "-"}
          tone="amber"
          delta={latestExam ? formatTRDate(latestExam.date) : "veri bekleniyor"}
          sub={latestExam ? "son deneme" : "deneme yok"}
          icon="bars"
        />
        <StatCard
          label="Soru Neti"
          value={formatNumber(questionNet)}
          unit="net"
          tone="rose"
          delta={`${questionSessions.length} kayıt`}
          sub="bu hafta"
          icon="spark"
        />
      </section>

      <div className="student-overview-split">
        <section className="student-overview-panel">
          <header className="student-overview-panel-head">
            <div>
              <h2>Bugünkü görevler</h2>
              <p>Koçunun bugün için tanımladığı görevler</p>
            </div>
          </header>

          <div className="student-overview-task-list">
            {todayTasks.length === 0 ? (
              <div className="student-overview-empty">
                Bugün için atanmış görev yok.
              </div>
            ) : (
              todayTasks.map((task, index) => (
                <div
                  key={`${task.row}-${task.col}`}
                  className="student-overview-task"
                >
                  <span className="student-overview-task-order">{index + 1}</span>
                  <span className="student-overview-task-body">
                    <strong>{task.title}</strong>
                    <small>{task.sub || "Görev detayı eklenmemiş"}</small>
                  </span>
                  <span className="student-overview-task-time">~45 dk</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="student-overview-panel">
          <header className="student-overview-panel-head">
            <div>
              <h2>Net gelişimin</h2>
              <p>Son 8 deneme · toplam net</p>
            </div>
          </header>

          <div className="student-overview-chart exam-line-chart-panel">
            <ExamLineChart data={totalChartData} />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  tone,
  delta,
  sub,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  tone: "teal" | "green" | "amber" | "rose";
  delta: string;
  sub: string;
  icon: "check" | "trend" | "bars" | "spark";
}) {
  return (
    <article className="student-overview-stat-card">
      <div className="student-overview-stat-head">
        <span>{label}</span>
        <span className={`student-overview-stat-icon ${tone}`}>
          {icon === "check" && <CheckIcon />}
          {icon === "trend" && <TrendIcon />}
          {icon === "bars" && <BarsIcon />}
          {icon === "spark" && <SparkIcon />}
        </span>
      </div>
      <strong>
        {value}
        {unit && <small>{unit}</small>}
      </strong>
      <div className="student-overview-stat-foot">
        <span>{delta}</span>
        <small>{sub}</small>
      </div>
    </article>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V8" />
      <path d="M12 19V5" />
      <path d="M19 19v-9" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="m6 6 2.5 2.5" />
      <path d="m15.5 15.5 2.5 2.5" />
      <path d="m18 6-2.5 2.5" />
      <path d="m8.5 15.5-2.5 2.5" />
    </svg>
  );
}
