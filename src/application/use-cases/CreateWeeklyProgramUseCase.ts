import { IWeeklyProgramRepository } from "../ports/IWeeklyProgramRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { TaskCompletionService } from "@/domain/services/TaskCompletionService";
import { WeeklyProgramDto } from "../dto";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";

export class CreateWeeklyProgramUseCase {
  private readonly taskCompletion = new TaskCompletionService();

  constructor(
    private readonly programs: IWeeklyProgramRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(input: {
    studentId: string;
    weekStart: Date;
    grid: Grid7x10;
  }): Promise<WeeklyProgramDto> {
    const engagement = await this.engagements.findActiveByStudent(
      input.studentId
    );
    if (!engagement) throw new NoActiveEngagementError();

    const rate = this.taskCompletion.calculate(input.grid);
    const program = await this.programs.upsert(
      engagement.id,
      input.studentId,
      input.weekStart,
      input.grid,
      rate.percent
    );
    return {
      id: program.id,
      studentId: program.studentId,
      weekStart: program.weekStart.toISOString().slice(0, 10),
      grid: program.grid.toJSON(),
      completionPercent: program.completionRate().percent,
    };
  }
}
