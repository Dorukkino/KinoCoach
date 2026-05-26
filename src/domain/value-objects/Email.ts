import { DomainError } from "../errors/DomainError";

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const value = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new DomainError("Invalid email address");
    }
    return new Email(value);
  }
}
