import { Grid7x10 } from "../value-objects/Grid7x10";

export class LessonNet {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly weekStart: Date,
    public readonly grid: Grid7x10
  ) {}

  withGrid(grid: Grid7x10): LessonNet {
    return new LessonNet(this.id, this.studentId, this.weekStart, grid);
  }
}
