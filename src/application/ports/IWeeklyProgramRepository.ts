import { WeeklyProgram } from "@/domain/entities/WeeklyProgram";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";

export interface WeeklyProgramSummary {
  id: string;
  studentId: string;
  weekStart: Date;
  completionRate: number;
  totalTasksCount: number;
  completedTasksCount: number;
  version: number;
  updatedAt: string | null;
}

export interface IWeeklyProgramRepository {
  findByEngagementAndWeek(
    engagementId: string,
    weekStart: Date
  ): Promise<WeeklyProgram | null>;
  findSummaryByEngagementAndWeek(
    engagementId: string,
    weekStart: Date
  ): Promise<WeeklyProgramSummary | null>;
  findLatestByEngagement(
    engagementId: string
  ): Promise<WeeklyProgram | null>;
  listWeekStartsByEngagement(engagementId: string): Promise<Date[]>;
  upsert(
    engagementId: string,
    studentId: string,
    weekStart: Date,
    grid: Grid7x10,
    completionRate: number
  ): Promise<WeeklyProgram>;
  toggleCellAtomic(
    engagementId: string,
    weekStart: Date,
    row: number,
    col: number,
    expectedVersion?: number
  ): Promise<WeeklyProgram | null>;
}
