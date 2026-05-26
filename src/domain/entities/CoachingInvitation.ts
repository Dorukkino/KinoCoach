export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export class CoachingInvitation {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly coachId: string,
    public readonly status: InvitationStatus,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly respondedAt: Date | null = null
  ) {}

  isPending(): boolean {
    return this.status === "pending" && this.expiresAt.getTime() > Date.now();
  }

  isExpired(): boolean {
    return this.expiresAt.getTime() <= Date.now();
  }
}
