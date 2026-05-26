export type UserRoleValue = "coach" | "student";

export class UserRole {
  private constructor(public readonly value: UserRoleValue) {}

  static coach(): UserRole {
    return new UserRole("coach");
  }

  static student(): UserRole {
    return new UserRole("student");
  }

  static from(value: string): UserRole {
    if (value !== "coach" && value !== "student") {
      throw new Error(`Invalid role: ${value}`);
    }
    return new UserRole(value);
  }

  isCoach(): boolean {
    return this.value === "coach";
  }

  isStudent(): boolean {
    return this.value === "student";
  }
}
