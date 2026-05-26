import { IWeeklyProgramRepository } from "../ports/IWeeklyProgramRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";

function toLocalISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** "YYYY-MM-DD" gerçekten bir Pazartesi mi? */
function isMonday(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  return new Date(y, m - 1, d).getDay() === 1;
}

export class ListStudentWeeksUseCase {
  constructor(
    private readonly programs: IWeeklyProgramRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(studentId: string): Promise<string[]> {
    const engagement = await this.engagements.findActiveByStudent(studentId);
    if (!engagement) return [];
    const dates = await this.programs.listWeekStartsByEngagement(engagement.id);
    const iso = dates.map(toLocalISO);
    const unique = Array.from(new Set(iso.filter(isMonday)));
    return unique.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  }
}
