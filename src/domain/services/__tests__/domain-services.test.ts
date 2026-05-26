import { describe, it, expect } from "vitest";
import { Grid7x10 } from "../../value-objects/Grid7x10";
import { TaskCompletionService } from "../TaskCompletionService";
import { StudentStatusService } from "../StudentStatusService";
import { CompletionRate } from "../../value-objects/CompletionRate";

describe("TaskCompletionService", () => {
  it("calculates completion from grid", () => {
    const grid = Grid7x10.empty();
    const withTask = grid.setCell(0, 0, {
      title: "Test",
      sub: "",
      tone: "teal",
      done: true,
    });
    const withTask2 = withTask.setCell(0, 1, {
      title: "Test2",
      sub: "",
      tone: "teal",
      done: false,
    });
    const rate = new TaskCompletionService().calculate(withTask2);
    expect(rate.percent).toBe(50);
  });
});

describe("StudentStatusService", () => {
  it("maps thresholds correctly", () => {
    expect(
      StudentStatusService.fromCompletion(CompletionRate.create(85)).value
    ).toBe("green");
    expect(
      StudentStatusService.fromCompletion(CompletionRate.create(65)).value
    ).toBe("yellow");
    expect(
      StudentStatusService.fromCompletion(CompletionRate.create(30)).value
    ).toBe("red");
  });
});
