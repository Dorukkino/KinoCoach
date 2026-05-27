export class CoachNote {
  constructor(
    public readonly id: string,
    public readonly engagementId: string,
    public readonly coachId: string,
    public readonly studentId: string,
    public readonly note: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
