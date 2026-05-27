import { MotivationMessage } from "@/domain/entities/MotivationMessage";

export interface IMotivationRepository {
  create(
    engagementId: string,
    coachId: string,
    studentId: string,
    message: string
  ): Promise<MotivationMessage>;
  findByEngagement(engagementId: string): Promise<MotivationMessage[]>;
  findLatestByEngagement(engagementId: string): Promise<MotivationMessage | null>;
}
