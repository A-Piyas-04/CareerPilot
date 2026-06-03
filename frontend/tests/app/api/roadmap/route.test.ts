import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import("@/app/api/roadmap/route");

const ROADMAP_ID = "00000000-0000-4000-8000-000000000001";

describe("GET /api/roadmap", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
  });

  it("returns roadmaps with item counts", async () => {
    supabase.setTable("roadmaps", [
      {
        data: [
          {
            id: ROADMAP_ID,
            user_id: "00000000-0000-0000-0000-000000000001",
            target_role: "Engineer",
            duration_weeks: 4,
            progress_percent: 50,
            created_at: "2026-05-29T10:00:00Z",
            updated_at: "2026-05-29T10:00:00Z",
          },
        ],
      },
    ]);
    supabase.setTable("roadmap_items", [
      {
        data: [
          { roadmap_id: ROADMAP_ID, status: "done" },
          { roadmap_id: ROADMAP_ID, status: "todo" },
        ],
      },
    ]);

    const response = await route.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.roadmaps[0]).toMatchObject({
      id: ROADMAP_ID,
      item_count: 2,
      completed_count: 1,
    });
  });

  it("returns empty list when user has no roadmaps", async () => {
    const response = await route.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.roadmaps).toEqual([]);
  });
});
