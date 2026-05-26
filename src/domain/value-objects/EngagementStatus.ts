export type EngagementStatusValue = "active" | "ended" | "paused";

export class EngagementStatus {
  private constructor(public readonly value: EngagementStatusValue) {}

  static active(): EngagementStatus {
    return new EngagementStatus("active");
  }

  static ended(): EngagementStatus {
    return new EngagementStatus("ended");
  }

  static paused(): EngagementStatus {
    return new EngagementStatus("paused");
  }

  static from(value: string): EngagementStatus {
    if (value !== "active" && value !== "ended" && value !== "paused") {
      throw new Error(`Geçersiz engagement durumu: ${value}`);
    }
    return new EngagementStatus(value);
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isEnded(): boolean {
    return this.value === "ended";
  }

  isPaused(): boolean {
    return this.value === "paused";
  }
}
