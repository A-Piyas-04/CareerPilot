import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import("@/app/api/roadmap/[id]/route");

const ROADMAP_ID = "00000000-0000-4000-8000-000000000001";

describe("GET /api/roadmap/[id]", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
  });

  it("rejects invalid roadmap id", async () => {
    const response = await route.GET({} as Request, {
      params: Promise.resolve({ id: "invalid" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns roadmap detail with items", async () => {
    supabase.setTable("roadmaps", [
      {
        data: {
          id: ROADMAP_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          target_role: "Engineer",
          duration_weeks: 2,
          progress_percent: 0,
          created_at: "2026-05-29T10:00:00Z",
          updated_at: "2026-05-29T10:00:00Z",
        },
      },
    ]);
    supabase.setTable("roadmap_items", [
      {
        data: [
          {
            id: "item-1",
            roadmap_id: ROADMAP_ID,
            user_id: "00000000-0000-0000-0000-000000000001",
            week_number: 1,
            title: "Week 1",
            status: "todo",
            resources: [],
            created_at: "2026-05-29T10:00:00Z",
            updated_at: "2026-05-29T10:00:00Z",
          },
        ],
      },
    ]);

    const response = await route.GET({} as Request, {
      params: Promise.resolve({ id: ROADMAP_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.roadmap.id).toBe(ROADMAP_ID);
    expect(body.items[0].title).toBe("Week 1");
  });

  it("returns 404 when roadmap not found", async () => {
    supabase.setTable("roadmaps", [{ data: null, error: { message: "not found" } }]);

    const response = await route.GET({} as Request, {
      params: Promise.resolve({ id: ROADMAP_ID }),
    });

    expect(response.status).toBe(404);
  });
});
