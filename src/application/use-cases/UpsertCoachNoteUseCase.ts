import { ICoachNoteRepository } from "../ports/ICoachNoteRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { CoachNoteDto } from "../dto";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";

export class UpsertCoachNoteUseCase {
  constructor(
    private readonly notes: ICoachNoteRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(
    coachId: string,
    studentId: string,
    note: string
  ): Promise<CoachNoteDto> {
    const engagement = await this.engagements.findActiveByCoachAndStudent(
      coachId,
      studentId
    );
    if (!engagement) throw new NoActiveEngagementError();

    const result = await this.notes.create(
      engagement.id,
      coachId,
      studentId,
      note
    );
    return {
      id: result.id,
      studentId: result.studentId,
      note: result.note,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }
}
