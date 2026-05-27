import { IMotivationRepository } from "../ports/IMotivationRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { MotivationDisplayService } from "../services/MotivationDisplayService";
import { MotivationCardDto } from "../dto";
import { CoachingEngagement } from "@/domain/entities/CoachingEngagement";
import { MotivationMessage } from "@/domain/entities/MotivationMessage";

export class GetMotivationForStudentUseCase {
  private readonly display = new MotivationDisplayService();

  constructor(
    private readonly motivation: IMotivationRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(
    studentId: string,
    coachName: string
  ): Promise<MotivationCardDto | null> {
    const engagement = await this.engagements.findActiveByStudent(studentId);
    if (!engagement) return null;
    return this.executeForEngagement(engagement, coachName);
  }

  async executeForEngagement(
    engagement: CoachingEngagement,
    coachName: string
  ): Promise<MotivationCardDto | null> {
    const messages = await this.motivation.findByEngagement(engagement.id);
    return this.display.toCardDto(messages, coachName);
  }

  async fetchMessages(engagementId: string): Promise<MotivationMessage[]> {
    return this.motivation.findByEngagement(engagementId);
  }

  toCardDto(
    messages: MotivationMessage[],
    coachName: string
  ): MotivationCardDto | null {
    return this.display.toCardDto(messages, coachName);
  }
}
