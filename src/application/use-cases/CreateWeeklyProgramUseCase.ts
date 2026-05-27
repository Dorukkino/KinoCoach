import { IWeeklyProgramRepository } from "../ports/IWeeklyProgramRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { Grid7x10 } from "@/domain/value-objects/Grid7x10";
import { TaskCompletionService } from "@/domain/services/TaskCompletionService";
import { WeeklyProgramDto } from "../dto";
import { NoActiveEngagementError } from "@/domain/errors/EngagementErrors";
import { SendNotificationUseCase } from "./SendNotificationUseCase";
import { NotificationType } from "@/domain/value-objects/NotificationType";

export class CreateWeeklyProgramUseCase {
  private readonly taskCompletion = new TaskCompletionService();

  constructor(
    private readonly programs: IWeeklyProgramRepository,
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository,
    private readonly sendNotification?: SendNotificationUseCase
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

    if (this.sendNotification) {
      try {
        const student = await this.students.findById(input.studentId);
        if (student) {
          const weekStart = input.weekStart.toISOString().slice(0, 10);
          await this.sendNotification.execute({
            userId: student.userId,
            title: "Haftalık program eklendi",
            message: `Koçunuz ${formatWeekLabel(weekStart)} haftası için program oluşturdu.`,
            type: NotificationType.WEEKLY_PROGRAM_UPDATED,
            metadata: {
              studentId: input.studentId,
              weekStart,
              href: "/student/weekly",
            },
          });
        }
      } catch {
        // Bildirim hatası program kaydını geri almaz
      }
    }

    return {
      id: program.id,
      studentId: program.studentId,
      weekStart: program.weekStart.toISOString().slice(0, 10),
      grid: program.grid.toJSON(),
      completionPercent: program.completionRate().percent,
    };
  }
}

function formatWeekLabel(weekStart: string): string {
  const date = new Date(`${weekStart}T12:00:00`);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
