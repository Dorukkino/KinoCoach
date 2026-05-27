import { LoadActiveCoachStudentsUseCase } from "./LoadActiveCoachStudentsUseCase";
import { StudentCardDto } from "../dto";

export interface CoachStudentRowDto extends StudentCardDto {
  engagementId: string;
  schoolLevel: string | null;
  startedAt: string;
}

export class ListActiveStudentsForCoachUseCase {
  constructor(
    private readonly loadActiveCoachStudents: LoadActiveCoachStudentsUseCase
  ) {}

  async execute(coachId: string): Promise<CoachStudentRowDto[]> {
    const { rows } = await this.loadActiveCoachStudents.execute(coachId);
    return rows;
  }
}
