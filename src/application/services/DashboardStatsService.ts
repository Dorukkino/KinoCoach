import { Student } from "@/domain/entities/Student";
import { DashboardStatsDto, StudentCardDto } from "../dto";

export class DashboardStatsService {
  compute(students: Student[]): DashboardStatsDto {
    const total = students.length;
    let green = 0;
    let yellow = 0;
    let red = 0;
    let sumCompletion = 0;

    for (const s of students) {
      const st = s.status().value;
      if (st === "green") green++;
      else if (st === "yellow") yellow++;
      else red++;
      sumCompletion += s.taskCompletionRate.percent;
    }

    return {
      totalStudents: total,
      greenCount: green,
      yellowCount: yellow,
      redCount: red,
      avgCompletion: total ? Math.round(sumCompletion / total) : 0,
    };
  }

  computeFromCards(cards: StudentCardDto[]): DashboardStatsDto {
    const total = cards.length;
    let green = 0;
    let yellow = 0;
    let red = 0;
    let sumCompletion = 0;

    for (const c of cards) {
      if (c.status === "green") green++;
      else if (c.status === "yellow") yellow++;
      else red++;
      sumCompletion += c.completionPercent;
    }

    return {
      totalStudents: total,
      greenCount: green,
      yellowCount: yellow,
      redCount: red,
      avgCompletion: total ? Math.round(sumCompletion / total) : 0,
    };
  }
}
