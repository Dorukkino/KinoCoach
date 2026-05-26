import { CoachingInvitation } from "@/domain/entities/CoachingInvitation";

export interface CreateInvitationInput {
  studentId: string;
  coachId: string;
  token: string;
  expiresAt: Date;
}

export interface IInvitationRepository {
  findByToken(token: string): Promise<CoachingInvitation | null>;
  findById(id: string): Promise<CoachingInvitation | null>;
  findPendingForStudent(studentId: string): Promise<CoachingInvitation[]>;
  findByCoach(coachId: string): Promise<CoachingInvitation[]>;
  create(input: CreateInvitationInput): Promise<CoachingInvitation>;
  markAccepted(id: string): Promise<void>;
  markDeclined(id: string): Promise<void>;
}
