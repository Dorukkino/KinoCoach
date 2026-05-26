export type StudentStatusValue = "green" | "yellow" | "red";

export class StudentStatus {
  private constructor(public readonly value: StudentStatusValue) {}

  static green(): StudentStatus {
    return new StudentStatus("green");
  }

  static yellow(): StudentStatus {
    return new StudentStatus("yellow");
  }

  static red(): StudentStatus {
    return new StudentStatus("red");
  }

  static fromValue(value: StudentStatusValue): StudentStatus {
    return new StudentStatus(value);
  }

  /** Template mapping: good / warn / risk */
  toLegacyKey(): "good" | "warn" | "risk" {
    const map: Record<StudentStatusValue, "good" | "warn" | "risk"> = {
      green: "good",
      yellow: "warn",
      red: "risk",
    };
    return map[this.value];
  }

  labelTr(): string {
    const labels: Record<StudentStatusValue, string> = {
      green: "İyi gidiyor",
      yellow: "Ortalama",
      red: "Riskli",
    };
    return labels[this.value];
  }
}
