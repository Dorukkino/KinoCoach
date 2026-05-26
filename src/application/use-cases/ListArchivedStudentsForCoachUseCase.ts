import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentRepository } from "../ports/IStudentRepository";

export interface ArchivedStudentRowDto {
  engagementId: string;
  studentId: string;
  studentName: string;
  email: string;
  schoolLevel: string | null;
  startedAt: string;
  endedAt: string | null;
  endReason: string | null;
}

export class ListArchivedStudentsForCoachUseCase {
  constructor(
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository
  ) {}

  async execute(coachId: string): Promise<ArchivedStudentRowDto[]> {
    const historical = await this.engagements.findHistoricalByCoach(coachId);
    if (historical.length === 0) return [];

    const studentList = await this.students.findManyByIds(
      historical.map((e) => e.studentId)
    );
    const byId = new Map(studentList.map((s) => [s.id, s]));

    return historical
      .map((engagement) => {
        const student = byId.get(engagement.studentId);
        if (!student) return null;
        return {
          engagementId: engagement.id,
          studentId: student.id,
          studentName: student.name,
          email: student.email.value,
          schoolLevel: engagement.schoolLevel,
          startedAt: engagement.startedAt.toISOString(),
          endedAt: engagement.endedAt?.toISOString() ?? null,
          endReason: engagement.endReason,
        } satisfies ArchivedStudentRowDto;
      })
      .filter((row): row is ArchivedStudentRowDto => row !== null);
  }
}
