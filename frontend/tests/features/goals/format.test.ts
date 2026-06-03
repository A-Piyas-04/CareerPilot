import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatDate,
  formatRelativeDate,
  getDueLabel,
  sortTasks,
} from "@/features/goals/format";
import type { Task } from "@/features/goals/types";

describe("goals format helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T12:00:00Z"));
  });

  it("formats dates and relative labels", () => {
    expect(formatDate(null)).toBe("No date");
    expect(formatDate("2026-05-01T00:00:00Z")).toBe("May 1, 2026");
    expect(formatRelativeDate("2026-05-28T12:00:00Z")).toContain("ago");
  });

  it("returns due labels relative to today", () => {
    expect(getDueLabel(null)).toBe("No due date");
    expect(getDueLabel("2026-05-29T00:00:00Z")).toBe("Due today");
    expect(getDueLabel("2026-05-30T00:00:00Z")).toBe("Due tomorrow");
    expect(getDueLabel("2026-05-27T00:00:00Z")).toBe("2d overdue");
    expect(getDueLabel("2026-06-05T00:00:00Z")).toBe("Due in 7d");
  });

  it("sorts tasks by done status, due date, priority, and created_at", () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "Done",
        status: "done",
        priority: 3,
        due_date: "2026-06-01",
        created_at: "2026-05-01T00:00:00Z",
      } as Task,
      {
        id: "2",
        title: "High priority",
        status: "todo",
        priority: 3,
        due_date: "2026-06-01",
        created_at: "2026-05-02T00:00:00Z",
      } as Task,
      {
        id: "3",
        title: "Soon due",
        status: "todo",
        priority: 1,
        due_date: "2026-05-30",
        created_at: "2026-05-03T00:00:00Z",
      } as Task,
    ];

    const sorted = sortTasks(tasks).map((t) => t.id);
    expect(sorted).toEqual(["3", "2", "1"]);
  });
});
