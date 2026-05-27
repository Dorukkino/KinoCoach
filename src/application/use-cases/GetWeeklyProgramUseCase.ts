import { IWeeklyProgramRepository } from "../ports/IWeeklyProgramRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { WeeklyProgramDto } from "../dto";
import { CoachingEngagement } from "@/domain/entities/CoachingEngagement";

export class GetWeeklyProgramUseCase {
  constructor(
    private readonly programs: IWeeklyProgramRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  /**
   * Öğrencinin aktif engagement'ına ait belirli haftadaki programını döner.
   * Aktif engagement yoksa boş grid döner.
   */
  async execute(
    studentId: string,
    weekStart: Date
  ): Promise<WeeklyProgramDto> {
    const engagement = await this.engagements.findActiveByStudent(studentId);
    if (!engagement) {
      return this.emptyProgram(studentId, weekStart);
    }
    return this.executeForEngagement(engagement, weekStart);
  }

  async executeForEngagement(
    engagement: CoachingEngagement,
    weekStart: Date
  ): Promise<WeeklyProgramDto> {
    const program = await this.programs.findByEngagementAndWeek(
      engagement.id,
      weekStart
    );
    if (!program) {
      return this.emptyProgram(engagement.studentId, weekStart);
    }
    return {
      id: program.id,
      studentId: program.studentId,
      weekStart: program.weekStart.toISOString().slice(0, 10),
      grid: program.grid.toJSON(),
      completionPercent: program.completionRate().percent,
    };
  }

  private emptyProgram(studentId: string, weekStart: Date): WeeklyProgramDto {
    const empty = Grid7x10.empty();
    return {
      id: "",
      studentId,
      weekStart: weekStart.toISOString().slice(0, 10),
      grid: empty.toJSON(),
      completionPercent: 0,
    };
  }
}
