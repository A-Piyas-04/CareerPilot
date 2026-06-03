import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({
  GEMINI_MODEL: "gemini-test",
  GeminiApiError: class GeminiApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  createGeminiText: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const { createGeminiText, GeminiApiError } = await import("@/lib/gemini");
const route = await import("./route");

describe("POST /api/reminders/generate", () => {
  let supabase: FakeSupabase;
  let userIndex = 0;

  beforeEach(() => {
    supabase = new FakeSupabase();
    userIndex += 1;
    supabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: `00000000-0000-0000-0000-${String(userIndex).padStart(12, "0")}`,
        },
      },
      error: null,
    } as never);
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.mocked(createGeminiText).mockReset();
    seedCoreTables();
  });

  it("generates structured nudges from user activity", async () => {
    seedQuietTables();
    vi.mocked(createGeminiText).mockResolvedValue(
      JSON.stringify({
        nudges: [
          {
            actionHref: "/goals",
            actionLabel: "Open Tasks",
            message: "You have overdue tasks to clear today.",
            title: "Clear overdue tasks",
            type: "task",
          },
        ],
      }),
    );

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: false }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cached).toBe(false);
    expect(body.nudges[0]).toMatchObject({
      actionHref: "/goals",
      title: "Clear overdue tasks",
      type: "task",
    });
    expect(createGeminiText).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-test" }),
    );
  });

  it("uses deterministic fallback nudges when Gemini returns no nudges", async () => {
    vi.mocked(createGeminiText).mockResolvedValue(JSON.stringify({ nudges: [] }));

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: true }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.nudges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "overdue-tasks-deterministic",
          title: "Overdue tasks need attention",
        }),
      ]),
    );
  });

  it("uses deterministic fallback nudges for Gemini quota errors", async () => {
    vi.mocked(createGeminiText).mockRejectedValue(
      new GeminiApiError("You exceeded your current quota", 429),
    );

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: true }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cached).toBe(false);
    expect(body.nudges[0]).toMatchObject({
      id: "overdue-tasks-deterministic",
      type: "task",
    });
  });

  it("uses deterministic fallback nudges for invalid AI JSON", async () => {
    vi.mocked(createGeminiText).mockResolvedValue("not-json");

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: true }),
        method: "POST",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.nudges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "overdue-tasks-deterministic" }),
      ]),
    );
  });

  it("returns server-cached nudges until force refresh is requested", async () => {
    seedQuietTables();
    vi.mocked(createGeminiText)
      .mockResolvedValueOnce(
        JSON.stringify({
          nudges: [
            {
              actionHref: "/dashboard",
              actionLabel: "Open Dashboard",
              message: "Cached result should be reused.",
              title: "First result",
              type: "general",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          nudges: [
            {
              actionHref: "/dashboard",
              actionLabel: "Open Dashboard",
              message: "Forced refresh should replace the cache.",
              title: "Second result",
              type: "general",
            },
          ],
        }),
      );

    const firstResponse = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: false }),
        method: "POST",
      }),
    );
    const firstBody = await firstResponse.json();
    const secondResponse = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: false }),
        method: "POST",
      }),
    );
    const secondBody = await secondResponse.json();

    seedQuietTables();
    const forcedResponse = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: true }),
        method: "POST",
      }),
    );
    const forcedBody = await forcedResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(firstBody.cached).toBe(false);
    expect(firstBody.nudges[0].title).toBe("First result");
    expect(secondResponse.status).toBe(200);
    expect(secondBody.cached).toBe(true);
    expect(secondBody.nudges[0].title).toBe("First result");
    expect(forcedResponse.status).toBe(200);
    expect(forcedBody.cached).toBe(false);
    expect(forcedBody.nudges[0].title).toBe("Second result");
    expect(createGeminiText).toHaveBeenCalledTimes(2);
  });

  it("does not fail when optional roadmap and goal tables fail", async () => {
    supabase.setTable("roadmaps", [
      { error: { message: "permission denied for table roadmaps" } },
    ]);
    supabase.setTable("goals", [
      { error: { message: "permission denied for table goals" } },
    ]);
    vi.mocked(createGeminiText).mockResolvedValue(JSON.stringify({ nudges: [] }));

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", {
        body: JSON.stringify({ force: true }),
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
  });

  it("returns 401 when unauthenticated", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as never);

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(createGeminiText).not.toHaveBeenCalled();
  });

  function seedCoreTables() {
    supabase.setTable("applications", [
      {
        data: [
          {
            applied_at: "2026-05-26T10:00:00Z",
            created_at: "2026-05-20T10:00:00Z",
            id: "app-1",
            status: "applied",
          },
          {
            applied_at: null,
            created_at: "2026-05-21T10:00:00Z",
            id: "app-2",
            status: "saved",
          },
        ],
      },
    ]);
    supabase.setTable("tasks", [
      {
        data: [
          {
            completed_at: null,
            due_date: "2026-05-20",
            id: "task-1",
            status: "todo",
          },
          {
            completed_at: "2026-05-29T10:00:00Z",
            due_date: null,
            id: "task-2",
            status: "done",
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
            title: "Interview at Acme",
          },
        ],
      },
    ]);
    supabase.setTable("roadmaps", [
      { data: [{ id: "roadmap-1", progress_percent: 20 }] },
    ]);
    supabase.setTable("goals", [
      { data: [{ id: "goal-1", status: "active", target_date: "2026-06-01" }] },
    ]);
    supabase.setTable("roadmap_items", [
      {
        data: [
          {
            completed_at: null,
            due_date: "2026-05-31",
            id: "item-1",
            status: "todo",
          },
        ],
      },
    ]);
  }

  function seedQuietTables() {
    supabase.setTable("applications", [
      {
        data: [
          {
            applied_at: "2026-06-01T10:00:00Z",
            created_at: "2026-06-01T10:00:00Z",
            id: "app-quiet",
            status: "applied",
          },
        ],
      },
    ]);
    supabase.setTable("tasks", [{ data: [] }]);
    supabase.setTable("calendar_events", [{ data: [] }]);
    supabase.setTable("roadmaps", [
      { data: [{ id: "roadmap-quiet", progress_percent: 80 }] },
    ]);
    supabase.setTable("goals", [{ data: [] }]);
    supabase.setTable("roadmap_items", [{ data: [] }]);
    supabase.setTable("job_matches", [{ data: [] }]);
    supabase.setTable("job_searches", [{ data: [] }]);
  }
});
