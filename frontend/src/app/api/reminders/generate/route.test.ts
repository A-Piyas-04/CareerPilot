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

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.mocked(createGeminiText).mockReset();
    seedCoreTables();
  });

  it("generates structured nudges from user activity", async () => {
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

  it("accepts an empty nudges array", async () => {
    vi.mocked(createGeminiText).mockResolvedValue(JSON.stringify({ nudges: [] }));

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", { method: "POST" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.nudges).toEqual([]);
  });

  it("returns quota_exceeded for Gemini quota errors", async () => {
    vi.mocked(createGeminiText).mockRejectedValue(
      new GeminiApiError("You exceeded your current quota", 429),
    );

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", { method: "POST" }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe("quota_exceeded");
  });

  it("returns nudge_generation_failed for invalid AI JSON", async () => {
    vi.mocked(createGeminiText).mockResolvedValue("not-json");

    const response = await route.POST(
      new Request("http://localhost/api/reminders/generate", { method: "POST" }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("nudge_generation_failed");
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
      new Request("http://localhost/api/reminders/generate", { method: "POST" }),
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
});
