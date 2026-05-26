import { ILessonNetRepository } from "../ports/ILessonNetRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { LessonNetDto } from "../dto";

export class GetLessonNetUseCase {
  constructor(
    private readonly lessonNets: ILessonNetRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(
    studentId: string,
    weekStart: Date
  ): Promise<LessonNetDto> {
    const engagement = await this.engagements.findActiveByStudent(studentId);
    if (!engagement) {
      const empty = Grid7x10.empty();
      return {
        id: "",
        studentId,
        weekStart: weekStart.toISOString().slice(0, 10),
        grid: empty.toJSON(),
      };
    }
    const net = await this.lessonNets.findByEngagementAndWeek(
      engagement.id,
      weekStart
    );
    if (!net) {
      const empty = Grid7x10.empty();
      return {
        id: "",
        studentId,
        weekStart: weekStart.toISOString().slice(0, 10),
        grid: empty.toJSON(),
      };
    }
    return {
      id: net.id,
      studentId: net.studentId,
      weekStart: net.weekStart.toISOString().slice(0, 10),
      grid: net.grid.toJSON(),
    };
  }
}
