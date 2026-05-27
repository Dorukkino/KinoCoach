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

    if (
      this.sendNotification &&
      cellBefore &&
      cellAfter &&
      cellBefore.done !== cellAfter.done
    ) {
      try {
        const student = await this.students.findById(input.studentId);
        if (student) {
          const weekStart = input.weekStart.toISOString().slice(0, 10);
          const taskTitle = cellAfter.title || "Görev";
          await this.sendNotification.execute({
            userId: engagement.coachId,
            title: cellAfter.done
              ? "Öğrenci görev tamamladı"
              : "Öğrenci görev işaretini kaldırdı",
            message: cellAfter.done
              ? `${student.name} "${taskTitle}" görevini tamamladı. Haftalık ilerleme: %${rate.percent}.`
              : `${student.name} "${taskTitle}" görevindeki tamamlama işaretini kaldırdı. Haftalık ilerleme: %${rate.percent}.`,
            type: NotificationType.WEEKLY_TASK_TOGGLED,
            metadata: {
              studentId: input.studentId,
              weekStart,
              row: String(input.row),
              col: String(input.col),
              done: cellAfter.done ? "true" : "false",
              href: `/coach/students/${input.studentId}`,
            },
          });
        }
      } catch {
        // Bildirim hatası görev güncellemesini geri almaz
      }
    }

    return {
      id: program.id,
      studentId: program.studentId,
      weekStart: program.weekStart.toISOString().slice(0, 10),
      grid: program.grid.toJSON(),
      completionPercent: rate.percent,
    };
  }
}
