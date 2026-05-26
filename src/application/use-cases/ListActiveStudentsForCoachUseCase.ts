import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IStudentLastActivityQuery } from "../ports/IStudentLastActivityQuery";
import { CalculateStudentStatusService } from "../services/CalculateStudentStatusService";
import { StudentCardDto } from "../dto";

export interface CoachStudentRowDto extends StudentCardDto {
  engagementId: string;
  schoolLevel: string | null;
  startedAt: string;
}

export class ListActiveStudentsForCoachUseCase {
  constructor(
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository,
    private readonly statusMapper: CalculateStudentStatusService,
    private readonly lastActivity: IStudentLastActivityQuery
  ) {}

  async execute(coachId: string): Promise<CoachStudentRowDto[]> {
    const active = await this.engagements.findActiveByCoach(coachId);
    if (active.length === 0) return [];

    const studentIds = active.map((e) => e.studentId);
    const [studentList, lastActivityByStudent] = await Promise.all([
      this.students.findManyByIds(studentIds),
      this.lastActivity.findLatestByStudentIds(studentIds),
    ]);
    const byId = new Map(studentList.map((s) => [s.id, s]));

    return active
      .map((engagement) => {
        const student = byId.get(engagement.studentId);
        if (!student) return null;
        const card = this.statusMapper.toCardDto(
          student,
          lastActivityByStudent.get(student.id) ?? student.lastActiveAt
        );
        return {
          ...card,
          engagementId: engagement.id,
          schoolLevel: engagement.schoolLevel,
          startedAt: engagement.startedAt.toISOString(),
        } satisfies CoachStudentRowDto;
      })
      .filter((row): row is CoachStudentRowDto => row !== null);
  }
}
