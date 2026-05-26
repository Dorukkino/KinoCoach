import { CompletionRate } from "../value-objects/CompletionRate";
import { Email } from "../value-objects/Email";
import { StudentStatus } from "../value-objects/StudentStatus";
import { StudentStatusService } from "../services/StudentStatusService";

export class Student {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly taskCompletionRate: CompletionRate,
    public readonly lastActiveAt: Date | null = null,
    public readonly grade: string | null = null,
    public readonly track: string | null = null
  ) {}

  status(): StudentStatus {
    return StudentStatusService.fromCompletion(this.taskCompletionRate);
  }

  withCompletionRate(rate: CompletionRate): Student {
    return new Student(
      this.id,
      this.userId,
      this.name,
      this.email,
      rate,
      this.lastActiveAt,
      this.grade,
      this.track
    );
  }
}
