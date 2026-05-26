import { IMotivationRepository } from "../ports/IMotivationRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";

export class SetMotivationMessageUseCase {
  constructor(
    private readonly motivation: IMotivationRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(coachId: string, studentId: string, message: string) {
    const engagement = await this.engagements.findActiveByCoachAndStudent(
      coachId,
      studentId
    );
    if (!engagement) throw new NoActiveEngagementError();
    return this.motivation.create(
      engagement.id,
      coachId,
      studentId,
      message
    );
  }
}
