import { ICoachNoteRepository } from "../ports/ICoachNoteRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { CoachNoteDto } from "../dto";

export class GetCoachNoteUseCase {
  constructor(
    private readonly notes: ICoachNoteRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(
    coachId: string,
    studentId: string
  ): Promise<CoachNoteDto | null> {
    const engagement = await this.engagements.findActiveByCoachAndStudent(
      coachId,
      studentId
    );
    if (!engagement) return null;
    const note = await this.notes.findByEngagement(engagement.id);
    if (!note) return null;
    return {
      id: note.id,
      studentId: note.studentId,
      note: note.note,
      updatedAt: note.updatedAt.toISOString(),
    };
  }
}
