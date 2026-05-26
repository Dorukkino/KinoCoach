import { CompletionRate } from "../value-objects/CompletionRate";
import { Grid7x10 } from "../value-objects/Grid7x10";

export class TaskCompletionService {
  calculate(grid: Grid7x10): CompletionRate {
    const total = grid.totalTasks();
    if (total === 0) return CompletionRate.zero();
    const done = grid.completedTasks();
    return CompletionRate.create((done / total) * 100);
  }
}
