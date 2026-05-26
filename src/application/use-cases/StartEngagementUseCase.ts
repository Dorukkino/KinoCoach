import { IEngagementRepository } from "../ports/IEngagementRepository";
import { StudentAlreadyEngagedError } from "@/domain/errors/EngagementErrors";

export class StartEngagementUseCase {
  constructor(private readonly engagements: IEngagementRepository) {}

  async execute(input: {
    studentId: string;
    coachId: string;
    schoolLevel?: string;
    gradeAtStart?: string;
    track?: string;
  }) {
    const existing = await this.engagements.findActiveByStudent(
      input.studentId
    );
    if (existing) {
      throw new StudentAlreadyEngagedError();
    }
    return this.engagements.create({
      studentId: input.studentId,
      coachId: input.coachId,
      schoolLevel: input.schoolLevel,
      gradeAtStart: input.gradeAtStart,
      track: input.track,
    });
  }
}
