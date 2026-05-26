import { ILessonNetRepository } from "../ports/ILessonNetRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { LessonNetDto } from "../dto";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";

export class UpsertLessonNetUseCase {
  constructor(
    private readonly lessonNets: ILessonNetRepository,
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository
  ) {}

  async execute(input: {
    studentId: string;
    weekStart: Date;
    grid: Grid7x10;
  }): Promise<LessonNetDto> {
    const engagement = await this.engagements.findActiveByStudent(
      input.studentId
    );
    if (!engagement) throw new NoActiveEngagementError();

    const net = await this.lessonNets.upsert(
      engagement.id,
      input.studentId,
      input.weekStart,
      input.grid
    );
    await this.students.touchLastActive(input.studentId);
    return {
      id: net.id,
      studentId: net.studentId,
      weekStart: net.weekStart.toISOString().slice(0, 10),
      grid: net.grid.toJSON(),
    };
  }
}
