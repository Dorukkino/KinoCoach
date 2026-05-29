export type UserRoleValue = "coach" | "student" | "admin";

export class UserRole {
  private constructor(public readonly value: UserRoleValue) {}

  static coach(): UserRole {
    return new UserRole("coach");
  }

  static student(): UserRole {
    return new UserRole("student");
  }

  static admin(): UserRole {
    return new UserRole("admin");
  }

  static from(value: string): UserRole {
    if (value !== "coach" && value !== "student" && value !== "admin") {
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

  isAdmin(): boolean {
    return this.value === "admin";
  }
}
