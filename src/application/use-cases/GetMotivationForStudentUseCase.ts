import { IMotivationRepository } from "../ports/IMotivationRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { MotivationDisplayService } from "../services/MotivationDisplayService";
import { MotivationCardDto } from "../dto";

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
    const messages = await this.motivation.findByEngagement(engagement.id);
    return this.display.toCardDto(messages, coachName);
  }
}
