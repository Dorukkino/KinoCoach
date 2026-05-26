import { Student } from "@/domain/entities/Student";
import { StudentCardDto } from "../dto";
import { formatLastActive } from "@/lib/dates";

export class CalculateStudentStatusService {
  toCardDto(student: Student, lastActiveAt?: Date | null): StudentCardDto {
    const status = student.status();
    const activeAt = lastActiveAt ?? student.lastActiveAt;
    return {
      id: student.id,
      userId: student.userId,
      name: student.name,
      email: student.email.value,
      completionPercent: student.taskCompletionRate.percent,
      status: status.value,
      statusLabel: status.labelTr(),
      lastActive: activeAt ? formatLastActive(activeAt) : null,
      grade: student.grade,
      track: student.track,
    };
  }

  toCardDtos(students: Student[]): StudentCardDto[] {
    return students.map((s) => this.toCardDto(s));
  }
}
