import { CoachNote } from "@/domain/entities/CoachNote";

export interface ICoachNoteRepository {
  findById(id: string): Promise<CoachNote | null>;
  findByEngagement(engagementId: string): Promise<CoachNote[]>;
  findByEngagementIds(engagementIds: string[]): Promise<CoachNote[]>;
  create(
    engagementId: string,
    coachId: string,
    studentId: string,
    note: string
  ): Promise<CoachNote>;
  update(id: string, note: string): Promise<CoachNote>;
  delete(id: string): Promise<void>;
}
