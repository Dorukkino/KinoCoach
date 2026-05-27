import { ICoachNoteRepository } from "../ports/ICoachNoteRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IStudentLastActivityQuery } from "../ports/IStudentLastActivityQuery";
import { CalculateStudentStatusService } from "../services/CalculateStudentStatusService";
import { CoachNoteListItemDto } from "../dto";
import { CoachStudentRowDto } from "./ListActiveStudentsForCoachUseCase";

export class GetCoachNotesPageUseCase {
  constructor(
    private readonly notes: ICoachNoteRepository,
    private readonly students: IStudentRepository,
    private readonly engagements: IEngagementRepository,
    private readonly statusMapper: CalculateStudentStatusService,
    private readonly lastActivity: IStudentLastActivityQuery
  ) {}

  async execute(coachId: string): Promise<{
    students: CoachStudentRowDto[];
    notes: CoachNoteListItemDto[];
  }> {
    const active = await this.engagements.findActiveByCoach(coachId);
    if (active.length === 0) return { students: [], notes: [] };

    const studentIds = active.map((e) => e.studentId);
    const engagementIds = active.map((e) => e.id);

    const [studentList, noteList, lastActivityByStudent] = await Promise.all([
      this.students.findManyByIds(studentIds),
      this.notes.findByEngagementIds(engagementIds),
      this.lastActivity.findLatestByStudentIds(studentIds),
    ]);

    const byId = new Map(studentList.map((s) => [s.id, s]));
    const students = active
      .map((engagement) => {
        const student = byId.get(engagement.studentId);
        if (!student) return null;
        const card = this.statusMapper.toCardDto(
          student,
          lastActivityByStudent.get(student.id) ?? student.lastActiveAt
        );
        return {
          ...card,
          engagementId: engagement.id,
          schoolLevel: engagement.schoolLevel,
          startedAt: engagement.startedAt.toISOString(),
        } satisfies CoachStudentRowDto;
      })
      .filter((row): row is CoachStudentRowDto => row !== null);

    const studentById = new Map(studentList.map((s) => [s.id, s]));
    const notes = noteList.map((note) => {
      const student = studentById.get(note.studentId);
      return {
        id: note.id,
        studentId: note.studentId,
        studentName: student?.name ?? "Öğrenci",
        note: note.note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      };
    });

    return { students, notes };
  }
}
