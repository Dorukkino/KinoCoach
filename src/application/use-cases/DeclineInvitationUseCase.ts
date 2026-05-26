import { IInvitationRepository } from "../ports/IInvitationRepository";
import { IStudentRepository } from "../ports/IStudentRepository";
import { InvitationNotFoundError } from "@/domain/errors/EngagementErrors";

export class DeclineInvitationUseCase {
  constructor(
    private readonly invitations: IInvitationRepository,
    private readonly students: IStudentRepository
  ) {}

  async execute(token: string, studentUserId: string) {
    const invitation = await this.invitations.findByToken(token);
    if (!invitation) throw new InvitationNotFoundError();
    if (invitation.status !== "pending") return;

    const student = await this.students.findByUserId(studentUserId);
    if (!student || student.id !== invitation.studentId) {
      throw new InvitationNotFoundError();
    }
    await this.invitations.markDeclined(invitation.id);
  }
}
