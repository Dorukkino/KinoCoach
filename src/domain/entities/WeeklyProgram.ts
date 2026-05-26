import { Grid7x10 } from "../value-objects/Grid7x10";
import { CompletionRate } from "../value-objects/CompletionRate";
import { TaskCompletionService } from "../services/TaskCompletionService";

export class WeeklyProgram {
  private readonly completionService = new TaskCompletionService();

  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly weekStart: Date,
    public readonly grid: Grid7x10,
    public readonly storedCompletionRate: CompletionRate | null = null
  ) {}

  completionRate(): CompletionRate {
    return (
      this.storedCompletionRate ??
      this.completionService.calculate(this.grid)
    );
  }

  withGrid(grid: Grid7x10, rate: CompletionRate): WeeklyProgram {
    return new WeeklyProgram(
      this.id,
      this.studentId,
      this.weekStart,
      grid,
      rate
    );
  }
}
