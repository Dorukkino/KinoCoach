export class MotivationMessage {
  constructor(
    public readonly id: string,
    public readonly coachId: string,
    public readonly studentId: string,
    public readonly message: string,
    public readonly createdAt: Date
  ) {}
}
