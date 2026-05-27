import { IStudentRepository } from "../ports/IStudentRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentLastActivityQuery } from "../ports/IStudentLastActivityQuery";
import { CalculateStudentStatusService } from "../services/CalculateStudentStatusService";
import { StudentDetailDto } from "../dto";

export class GetStudentDetailUseCase {
  constructor(
    private readonly students: IStudentRepository,
    private readonly engagements: IEngagementRepository,
    private readonly statusMapper: CalculateStudentStatusService,
    private readonly lastActivity: IStudentLastActivityQuery
  ) {}

  /**
   * Bir öğrencinin detayını ve aktif engagement bilgisini döner.
   * @param studentId
   * @param coachId Çağıran koçun id'si (aktif engagement bu koç ile mi sorgulanır).
   */
  async execute(
    studentId: string,
    coachId?: string
  ): Promise<StudentDetailDto | null> {
    const [student, lastActivityMap, activeEngagement] = await Promise.all([
      this.students.findById(studentId),
      this.lastActivity.findLatestByStudentIds([studentId]),
      coachId
        ? this.engagements.findActiveByCoachAndStudent(coachId, studentId)
        : this.engagements.findActiveByStudent(studentId),
    ]);

    if (!student) return null;

    const card = this.statusMapper.toCardDto(
      student,
      lastActivityMap.get(studentId) ?? student.lastActiveAt
    );

    return {
      ...card,
      userId: student.userId,
      coachId: activeEngagement?.coachId ?? null,
      activeEngagementId: activeEngagement?.id ?? null,
    };
  }
}
