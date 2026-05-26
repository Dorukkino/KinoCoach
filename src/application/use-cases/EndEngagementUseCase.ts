import { IEngagementRepository } from "../ports/IEngagementRepository";

export class EndEngagementUseCase {
  constructor(private readonly engagements: IEngagementRepository) {}

  async execute(engagementId: string, coachId: string, reason?: string) {
    const engagement = await this.engagements.findById(engagementId);
    if (!engagement || engagement.coachId !== coachId) {
      throw new Error("Koçluk ilişkisi bulunamadı veya yetkiniz yok.");
    }
    if (!engagement.status.isActive()) {
      return;
    }
    await this.engagements.end(engagementId, reason);
  }
}
