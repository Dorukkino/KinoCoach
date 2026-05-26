import { EngagementStatus } from "../value-objects/EngagementStatus";

export class CoachingEngagement {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly coachId: string,
    public readonly status: EngagementStatus,
    public readonly startedAt: Date,
    public readonly endedAt: Date | null = null,
    public readonly endReason: string | null = null,
    public readonly schoolLevel: string | null = null,
    public readonly gradeAtStart: string | null = null,
    public readonly track: string | null = null
  ) {}

  end(reason?: string): CoachingEngagement {
    return new CoachingEngagement(
      this.id,
      this.studentId,
      this.coachId,
      EngagementStatus.ended(),
      this.startedAt,
      new Date(),
      reason ?? this.endReason,
      this.schoolLevel,
      this.gradeAtStart,
      this.track
    );
  }
}
