import { CoachingEngagement } from "@/domain/entities/CoachingEngagement";

export interface CreateEngagementInput {
  studentId: string;
  coachId: string;
  schoolLevel?: string;
  gradeAtStart?: string;
  track?: string;
}

export interface IEngagementRepository {
  findById(id: string): Promise<CoachingEngagement | null>;
  findActiveByStudent(studentId: string): Promise<CoachingEngagement | null>;
  findActiveByCoach(coachId: string): Promise<CoachingEngagement[]>;
  findAllActive(): Promise<CoachingEngagement[]>;
  findHistoricalByCoach(coachId: string): Promise<CoachingEngagement[]>;
  findAllByStudent(studentId: string): Promise<CoachingEngagement[]>;
  findActiveByCoachAndStudent(
    coachId: string,
    studentId: string
  ): Promise<CoachingEngagement | null>;
  create(input: CreateEngagementInput): Promise<CoachingEngagement>;
  end(id: string, reason?: string): Promise<void>;
}
