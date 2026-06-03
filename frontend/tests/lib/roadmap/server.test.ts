import { describe, expect, it } from "vitest";

import {
  isUuid,
  jsonError,
  normalizeRoadmap,
  normalizeRoadmapItem,
  recalculateRoadmapProgress,
} from "@/lib/roadmap/server";
import { FakeSupabase } from "@/test/fakeSupabase";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const ROADMAP_ID = "00000000-0000-4000-8000-000000000002";

describe("roadmap server helpers", () => {
  it("validates UUID format", () => {
    expect(isUuid("00000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });

  it("normalizes roadmap and item rows", () => {
    expect(
      normalizeRoadmap({
        id: ROADMAP_ID,
        user_id: USER_ID,
        target_role: "Engineer",
        duration_weeks: "8",
        progress_percent: "50",
      }),
    ).toMatchObject({
      duration_weeks: 8,
      progress_percent: 50,
      target_role: "Engineer",
    });

    expect(
      normalizeRoadmapItem({
        id: "item",
        roadmap_id: ROADMAP_ID,
        user_id: USER_ID,
        week_number: 1,
        title: "Week 1",
        status: "invalid",
        resources: [{ name: "Docs", url: "https://example.com" }, { bad: true }],
      }),
    ).toMatchObject({
      status: "todo",
      resources: [{ name: "Docs", url: "https://example.com" }],
    });
  });

  it("returns json error response", async () => {
    const response = jsonError("Bad request", 400);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ detail: "Bad request" });
  });

  it("recalculates roadmap progress from item statuses", async () => {
    const supabase = new FakeSupabase();
    supabase.setTable("roadmap_items", [
      {
        data: [
          { status: "done" },
          { status: "todo" },
          { status: "done" },
        ],
      },
    ]);
    supabase.setTable("roadmaps", [{ data: null }]);

    const progress = await recalculateRoadmapProgress(
      supabase as never,
      ROADMAP_ID,
      USER_ID,
    );

    expect(progress).toBe(66.67);
    expect(supabase.calls.some((c) => c.table === "roadmaps" && c.mode === "update")).toBe(
      true,
    );
  });
});
