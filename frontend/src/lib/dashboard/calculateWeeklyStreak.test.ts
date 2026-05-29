import { describe, expect, it } from "vitest";

import { calculateWeeklyStreak } from "./calculateWeeklyStreak";

describe("calculateWeeklyStreak", () => {
  const friday = new Date("2026-05-29T12:00:00Z");

  it("returns 0 when the current week has no completed task", () => {
    expect(
      calculateWeeklyStreak(["2026-05-18T09:00:00Z"], friday),
    ).toBe(0);
  });

  it("counts consecutive Monday-start weeks from the current week", () => {
    expect(
      calculateWeeklyStreak(
        [
          "2026-05-29T09:00:00Z",
          "2026-05-18T09:00:00Z",
          "2026-05-11T09:00:00Z",
        ],
        friday,
      ),
    ).toBe(3);
  });

  it("stops counting at the first missing week", () => {
    expect(
      calculateWeeklyStreak(
        [
          "2026-05-29T09:00:00Z",
          "2026-05-11T09:00:00Z",
        ],
        friday,
      ),
    ).toBe(1);
  });
});
