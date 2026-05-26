import { IEngagementRepository } from "../ports/IEngagementRepository";
import { IInvitationRepository } from "../ports/IInvitationRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import {
  InvitationExpiredError,
  InvitationNotFoundError,
  StudentAlreadyEngagedError,
} from "@/domain/errors/EngagementErrors";

export class AcceptInvitationUseCase {
  constructor(
    private readonly invitations: IInvitationRepository,
    private readonly engagements: IEngagementRepository,
    private readonly students: IStudentRepository
  ) {}

  /**
   * Öğrenci daveti kabul eder: engagement açar, daveti accepted işaretler.
   * @param token davet token'ı
   * @param studentUserId daveti kabul eden öğrencinin auth user id'si
   */
  async execute(token: string, studentUserId: string) {
    const invitation = await this.invitations.findByToken(token);
    if (!invitation) throw new InvitationNotFoundError();
    if (invitation.status !== "pending") throw new InvitationNotFoundError();
    if (invitation.isExpired()) throw new InvitationExpiredError();

    const student = await this.students.findByUserId(studentUserId);
    if (!student || student.id !== invitation.studentId) {
      throw new InvitationNotFoundError();
    }

    const active = await this.engagements.findActiveByStudent(invitation.studentId);
    if (active) {
      throw new StudentAlreadyEngagedError();
    }

    const engagement = await this.engagements.create({
      studentId: invitation.studentId,
      coachId: invitation.coachId,
      gradeAtStart: student.grade ?? undefined,
      track: student.track ?? undefined,
    });
    await this.invitations.markAccepted(invitation.id);
    return engagement;
  }
}
