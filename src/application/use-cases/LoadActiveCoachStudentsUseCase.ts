import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IStudentLastActivityQuery } from "../ports/IStudentLastActivityQuery";
import { CalculateStudentStatusService } from "../services/CalculateStudentStatusService";
import { CoachingEngagement } from "@/domain/entities/CoachingEngagement";
import { CoachStudentRowDto } from "./ListActiveStudentsForCoachUseCase";

export interface LoadActiveCoachStudentsResult {
  engagements: CoachingEngagement[];
  rows: CoachStudentRowDto[];
}

export class LoadActiveCoachStudentsUseCase {
  constructor(
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository,
    private readonly statusMapper: CalculateStudentStatusService,
    private readonly lastActivity: IStudentLastActivityQuery
  ) {}

  async execute(coachId: string): Promise<LoadActiveCoachStudentsResult> {
    const active = await this.engagements.findActiveByCoach(coachId);
    if (active.length === 0) return { engagements: [], rows: [] };

    const studentIds = active.map((e) => e.studentId);
    const [studentList, lastActivityByStudent] = await Promise.all([
      this.students.findManyByIds(studentIds),
      this.lastActivity.findLatestByStudentIds(studentIds),
    ]);
    const byId = new Map(studentList.map((s) => [s.id, s]));

    const rows = active
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

    return { engagements: active, rows };
  }
}
