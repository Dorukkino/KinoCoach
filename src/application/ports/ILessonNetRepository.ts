import { LessonNet } from "@/domain/entities/LessonNet";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";

export interface ILessonNetRepository {
  findByEngagementAndWeek(
    engagementId: string,
    weekStart: Date
  ): Promise<LessonNet | null>;
  upsert(
    engagementId: string,
    studentId: string,
    weekStart: Date,
    grid: Grid7x10
  ): Promise<LessonNet>;
}
