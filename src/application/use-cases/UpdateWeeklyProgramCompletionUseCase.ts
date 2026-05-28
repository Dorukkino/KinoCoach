import { IWeeklyProgramRepository } from "../ports/IWeeklyProgramRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { TaskCompletionService } from "@/domain/services/TaskCompletionService";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { WeeklyProgramDto } from "../dto";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";
import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";

export class UpdateWeeklyProgramCompletionUseCase {
  private readonly taskCompletion = new TaskCompletionService();

  constructor(
    private readonly programs: IWeeklyProgramRepository,
    private readonly students: IStudentRepository,
    private readonly engagements: IEngagementRepository,
    private readonly sendNotification?: SendNotificationUseCase
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
    const expectedVersion = existing
      ? (await this.programs.findSummaryByEngagementAndWeek(
          engagement.id,
          input.weekStart
        ))?.version
      : undefined;

    const atomic = await this.programs.toggleCellAtomic(
      engagement.id,
      input.weekStart,
      input.row,
      input.col,
      expectedVersion
    );

    if (atomic) {
      const rate = atomic.completionRate().percent;
      const cellBefore = existing?.grid.cells[input.row]?.[input.col];
      const cellAfter = atomic.grid.cells[input.row]?.[input.col];
      await this.students.update(input.studentId, {
        taskCompletionRate: rate,
      });
      await this.maybeNotifyToggle(
        input,
        engagement.coachId,
        engagement.id,
        existing,
        atomic.grid,
        rate,
        cellBefore,
        cellAfter
      );
      return {
        id: atomic.id,
        studentId: atomic.studentId,
        weekStart: atomic.weekStart.toISOString().slice(0, 10),
        grid: atomic.grid.toJSON(),
        completionPercent: rate,
      };
    }

    const grid = existing?.grid ?? Grid7x10.empty();
    const cellBefore = grid.cells[input.row]?.[input.col];
    const updatedGrid = grid.toggleDone(input.row, input.col);
    const cellAfter = updatedGrid.cells[input.row]?.[input.col];
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

    await this.maybeNotifyToggle(
      input,
      engagement.coachId,
      engagement.id,
      existing,
      updatedGrid,
      rate.percent,
      cellBefore,
      cellAfter
    );

    return {
      id: program.id,
      studentId: program.studentId,
      weekStart: program.weekStart.toISOString().slice(0, 10),
      grid: program.grid.toJSON(),
      completionPercent: rate.percent,
    };
  }

  private async maybeNotifyToggle(
    input: { studentId: string; weekStart: Date; row: number; col: number },
    coachId: string,
    engagementId: string,
    existing: Awaited<
      ReturnType<IWeeklyProgramRepository["findByEngagementAndWeek"]>
    >,
    grid: Grid7x10,
    ratePercent: number,
    cellBefore?: Grid7x10["cells"][number][number],
    cellAfter?: Grid7x10["cells"][number][number]
  ) {
    if (!this.sendNotification) return;

    const before =
      cellBefore ?? existing?.grid.cells[input.row]?.[input.col] ?? null;
    const after = cellAfter ?? grid.cells[input.row]?.[input.col] ?? null;
    if (!before || !after || before.done === after.done) return;

    try {
      const student = await this.students.findById(input.studentId);
      if (!student) return;
      const weekStart = input.weekStart.toISOString().slice(0, 10);
      const taskTitle = after.title || "Görev";
      await this.sendNotification.execute({
        userId: coachId,
        title: after.done
          ? "Öğrenci görev tamamladı"
          : "Öğrenci görev işaretini kaldırdı",
        message: after.done
          ? `${student.name} "${taskTitle}" görevini tamamladı. Haftalık ilerleme: %${ratePercent}.`
          : `${student.name} "${taskTitle}" görevindeki tamamlama işaretini kaldırdı. Haftalık ilerleme: %${ratePercent}.`,
        type: NotificationType.WEEKLY_TASK_TOGGLED,
        metadata: {
          studentId: input.studentId,
          weekStart,
          row: String(input.row),
          col: String(input.col),
          done: after.done ? "true" : "false",
          href: `/coach/students/${input.studentId}`,
        },
      });
    } catch {
      // ignore
    }
  }
}
