import { MotivationMessage } from "@/domain/entities/MotivationMessage";
import { MotivationService } from "@/domain/services/MotivationService";
import { MotivationCardDto } from "../dto";

export class MotivationDisplayService {
  private readonly motivationService = new MotivationService();

  toCardDto(
    messages: MotivationMessage[],
    coachName: string
  ): MotivationCardDto | null {
    const latest = this.motivationService.pickLatest(messages);
    if (!latest) return null;
    return {
      message: latest.message,
      coachName,
      createdAt: latest.createdAt.toISOString(),
    };
  }
}
