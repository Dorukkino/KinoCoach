import { CoachNote } from "@/domain/entities/CoachNote";

export interface ICoachNoteRepository {
  findByEngagement(engagementId: string): Promise<CoachNote | null>;
  findByEngagementIds(engagementIds: string[]): Promise<CoachNote[]>;
  upsert(
    engagementId: string,
    coachId: string,
    studentId: string,
    note: string
  ): Promise<CoachNote>;
}
