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
  ): Promise<CoachNoteDto[]> {
    const engagement = await this.engagements.findActiveByCoachAndStudent(
      coachId,
      studentId
    );
    if (!engagement) return [];
    const notes = await this.notes.findByEngagement(engagement.id);
    return notes.map((note) => ({
      id: note.id,
      studentId: note.studentId,
      note: note.note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }));
  }
}
