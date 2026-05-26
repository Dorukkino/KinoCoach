import { DomainError } from "../errors/DomainError";

export class CompletionRate {
  private constructor(public readonly percent: number) {}

  static create(percent: number): CompletionRate {
    if (percent < 0 || percent > 100 || Number.isNaN(percent)) {
      throw new DomainError("Completion rate must be between 0 and 100");
    }
    return new CompletionRate(Math.round(percent));
  }

  static zero(): CompletionRate {
    return new CompletionRate(0);
  }
}
