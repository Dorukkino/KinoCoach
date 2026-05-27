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
    const latest = await this.motivation.findLatestByEngagement(engagement.id);
    return this.display.toCardDto(latest ? [latest] : [], coachName);
  }

  async fetchLatest(engagementId: string): Promise<MotivationMessage | null> {
    return this.motivation.findLatestByEngagement(engagementId);
  }

  toCardDto(
    messages: MotivationMessage[],
    coachName: string
  ): MotivationCardDto | null {
    return this.display.toCardDto(messages, coachName);
  }
}
