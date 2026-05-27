import { ICoachNoteRepository } from "../ports/ICoachNoteRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { IEngagementRepository } from "../ports/IEngagementRepository";
import { CoachNoteListItemDto } from "../dto";

export class ListCoachNotesUseCase {
  constructor(
    private readonly notes: ICoachNoteRepository,
    private readonly students: IStudentRepository,
    private readonly engagements: IEngagementRepository
  ) {}

  async execute(coachId: string): Promise<CoachNoteListItemDto[]> {
    const active = await this.engagements.findActiveByCoach(coachId);
    if (active.length === 0) return [];

    const [studentList, noteList] = await Promise.all([
      this.students.findManyByIds(active.map((e) => e.studentId)),
      this.notes.findByEngagementIds(active.map((e) => e.id)),
    ]);

    const studentById = new Map(studentList.map((s) => [s.id, s]));
    return noteList.map((note) => {
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
  }
}
