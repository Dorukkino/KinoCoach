import { WeeklyProgram } from "@/domain/entities/WeeklyProgram";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";

export interface IWeeklyProgramRepository {
  findByEngagementAndWeek(
    engagementId: string,
    weekStart: Date
  ): Promise<WeeklyProgram | null>;
  findLatestByEngagement(
    engagementId: string
  ): Promise<WeeklyProgram | null>;
  /** Engagement'a ait kayıtlı tüm hafta başlangıçlarını (yeni → eski) döner */
  listWeekStartsByEngagement(engagementId: string): Promise<Date[]>;
  upsert(
    engagementId: string,
    studentId: string,
    weekStart: Date,
    grid: Grid7x10,
    completionRate: number
  ): Promise<WeeklyProgram>;
}
