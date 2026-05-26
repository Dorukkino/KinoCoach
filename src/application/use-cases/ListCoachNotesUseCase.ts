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
    const noteByEngagement = new Map(
      noteList.map((n) => [
        // CoachNote shape includes engagement reference via the upsert call; we
        // assume one note per engagement (UNIQUE constraint), so match using
        // coach_id + student_id mapping via the engagement.
        `${n.coachId}:${n.studentId}`,
        n,
      ])
    );

    return active.map((engagement) => {
      const student = studentById.get(engagement.studentId);
      const note = noteByEngagement.get(
        `${engagement.coachId}:${engagement.studentId}`
      );
      return {
        studentId: engagement.studentId,
        studentName: student?.name ?? "Öğrenci",
        note: note?.note ?? "",
        updatedAt: note?.updatedAt.toISOString() ?? null,
      };
    });
  }
}
