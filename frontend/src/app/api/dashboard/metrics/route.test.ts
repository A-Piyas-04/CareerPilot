import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import("./route");

describe("GET /api/dashboard/metrics", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    vi.useFakeTimers();
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.setSystemTime(new Date("2026-05-29T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aggregates user-scoped dashboard metrics and recent activity", async () => {
    supabase.setTable("applications", [
      {
        data: [
          {
            id: "app-1",
            job_id: "job-1",
            manual_company: null,
            manual_job_title: null,
            status: "applied",
          },
          {
            id: "app-2",
            jobs: null,
            manual_company: "Beta",
            manual_job_title: "Backend Intern",
            status: "interviewing",
          },
          {
            id: "app-3",
            jobs: null,
            manual_company: "Gamma",
            manual_job_title: "Frontend Role",
            status: "saved",
          },
        ],
      },
    ]);
    supabase.setTable("jobs", [
      {
        data: [{ company: "Acme", id: "job-1", title: "ML Engineer" }],
      },
    ]);
    supabase.setTable("roadmaps", [
      {
        data: [
          { id: "roadmap-1", progress_percent: 50 },
          { id: "roadmap-2", progress_percent: 100 },
        ],
      },
    ]);
    supabase.setTable("tasks", [
      {
        data: [
          {
            completed_at: "2026-05-29T09:00:00Z",
            id: "task-1",
            status: "done",
            title: "Finish dashboard",
          },
          {
            completed_at: "2026-05-18T09:00:00Z",
            id: "task-2",
            status: "done",
            title: "Older task",
          },
        ],
      },
    ]);
    supabase.setTable("calendar_events", [
      {
        data: [
          {
            event_type: "interview",
            id: "event-1",
            start_time: "2026-05-30T10:00:00Z",
            title: "Interview",
          },
        ],
      },
    ]);
    supabase.setTable("roadmap_items", [
      {
        data: [
          {
            completed_at: "2026-05-29T08:00:00Z",
            id: "item-1",
            status: "done",
            title: "Build ML project",
          },
        ],
      },
    ]);
    supabase.setTable("application_history", [
      {
        data: [
          {
            application_id: "app-1",
            changed_at: "2026-05-29T07:00:00Z",
            id: "history-1",
            new_status: "applied",
            old_status: "saved",
          },
        ],
      },
    ]);

    const response = await route.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics).toMatchObject({
      activeApplications: 2,
      jobsApplied: 1,
      roadmapItemsDone: 1,
      roadmapProgress: 75,
      tasksCompletedThisWeek: 1,
      weeklyStreak: 2,
    });
    expect(body.pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "saved", count: 1 }),
        expect.objectContaining({ status: "applied", count: 1 }),
        expect.objectContaining({ status: "interviewing", count: 1 }),
        expect.objectContaining({ status: "offer", count: 0 }),
        expect.objectContaining({ status: "rejected", count: 0 }),
      ]),
    );
    expect(body.upcomingEvents[0]).toMatchObject({
      eventType: "interview",
      title: "Interview",
    });
    expect(body.recentActivity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          description: "Completed task",
          title: "Finish dashboard",
          type: "task",
        }),
        expect.objectContaining({
          description: "Moved from Saved to Applied",
          title: "ML Engineer at Acme",
          type: "application",
        }),
      ]),
    );
    expect(
      supabase.calls
        .filter((call) => ["applications", "tasks", "calendar_events"].includes(call.table))
        .every((call) =>
          call.filters.some(
            ([key, value]) =>
              key === "user_id" && value === "00000000-0000-0000-0000-000000000001",
          ),
        ),
    ).toBe(true);
  });

  it("returns zeroed metrics for an empty user", async () => {
    const response = await route.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics).toEqual({
      activeApplications: 0,
      jobsApplied: 0,
      roadmapItemsDone: 0,
      roadmapProgress: 0,
      tasksCompletedThisWeek: 0,
      weeklyStreak: 0,
    });
    expect(body.pipeline).toHaveLength(5);
    expect(body.upcomingEvents).toEqual([]);
    expect(body.recentActivity).toEqual([]);
  });

  it("does not fail when optional roadmap tables are unavailable", async () => {
    supabase.setTable("roadmaps", [
      { error: { message: "permission denied for table roadmaps" } },
    ]);

    const response = await route.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.roadmapProgress).toBe(0);
    expect(body.metrics.roadmapItemsDone).toBe(0);
  });
});
