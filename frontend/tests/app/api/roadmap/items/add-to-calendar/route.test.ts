import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import(
  "@/app/api/roadmap/items/[itemId]/add-to-calendar/route"
);

const ITEM_ID = "00000000-0000-4000-8000-000000000003";

describe("POST /api/roadmap/items/[itemId]/add-to-calendar", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
  });

  it("rejects invalid item id", async () => {
    const response = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ startTime: "2026-06-01T10:00:00Z" }),
      }) as never,
      { params: Promise.resolve({ itemId: "bad" }) },
    );
    expect(response.status).toBe(400);
  });

  it("requires valid start time", async () => {
    const response = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ startTime: "not-a-date" }),
      }) as never,
      { params: Promise.resolve({ itemId: ITEM_ID }) },
    );
    expect(response.status).toBe(400);
  });

  it("creates calendar study event from roadmap item", async () => {
    supabase.setTable("roadmap_items", [
      {
        data: {
          id: ITEM_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          title: "Study session",
          description: "Review notes",
        },
      },
    ]);
    supabase.setTable("tasks", [{ data: { id: "task-1" } }]);
    supabase.setTable("calendar_events", [
      {
        data: {
          id: "evt-1",
          title: "Study session",
          event_type: "study",
          start_time: "2026-06-01T10:00:00.000Z",
        },
      },
    ]);

    const response = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          startTime: "2026-06-01T10:00:00Z",
          endTime: "2026-06-01T11:00:00Z",
        }),
      }) as never,
      { params: Promise.resolve({ itemId: ITEM_ID }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.event.title).toBe("Study session");
    expect(body.event.event_type).toBe("study");
    expect(supabase.calls.some((c) => c.table === "calendar_events")).toBe(true);
  });
});
