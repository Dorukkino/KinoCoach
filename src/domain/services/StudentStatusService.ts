import { CompletionRate } from "../value-objects/CompletionRate";
import { StudentStatus } from "../value-objects/StudentStatus";

export class StudentStatusService {
  static fromCompletion(rate: CompletionRate): StudentStatus {
    if (rate.percent >= 80) return StudentStatus.green();
    if (rate.percent >= 50) return StudentStatus.yellow();
    return StudentStatus.red();
  }
}
