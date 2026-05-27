import { IWeeklyProgramRepository } from "../ports/IWeeklyProgramRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { TaskCompletionService } from "@/domain/services/TaskCompletionService";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { WeeklyProgramDto } from "../dto";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";

export class UpdateWeeklyProgramCompletionUseCase {
  private readonly taskCompletion = new TaskCompletionService();

  constructor(
    private readonly programs: IWeeklyProgramRepository,
    private readonly students: IStudentRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(input: {
    studentId: string;
    weekStart: Date;
    row: number;
    col: number;
  }): Promise<WeeklyProgramDto> {
    const engagement = await this.engagements.findActiveByStudent(
      input.studentId
    );
    if (!engagement) throw new NoActiveEngagementError();

    const existing = await this.programs.findByEngagementAndWeek(
      engagement.id,
      input.weekStart
    );
    const grid = existing?.grid ?? Grid7x10.empty();
    const updatedGrid = grid.toggleDone(input.row, input.col);
    const rate = this.taskCompletion.calculate(updatedGrid);

    const [program] = await Promise.all([
      this.programs.upsert(
        engagement.id,
        input.studentId,
        input.weekStart,
        updatedGrid,
        rate.percent
      ),
      this.students.update(input.studentId, {
        taskCompletionRate: rate.percent,
      }),
    ]);

    return {
      id: program.id,
      studentId: program.studentId,
      weekStart: program.weekStart.toISOString().slice(0, 10),
      grid: program.grid.toJSON(),
      completionPercent: rate.percent,
    };
  }
}
