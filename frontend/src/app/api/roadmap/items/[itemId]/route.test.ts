import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import("./route");

describe("PATCH /api/roadmap/items/[itemId]", () => {
  let supabase: FakeSupabase;
  const itemId = "00000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
  });

  it("sets completed_at and recalculates roadmap progress", async () => {
    supabase.setTable("roadmap_items", [
      {
        data: {
          created_at: "2026-05-29T10:00:00Z",
          id: itemId,
          roadmap_id: "roadmap",
          status: "todo",
          title: "Week 1",
          updated_at: "2026-05-29T10:00:00Z",
          user_id: "00000000-0000-0000-0000-000000000001",
          week_number: 1,
        },
      },
      {
        data: {
          created_at: "2026-05-29T10:00:00Z",
          id: itemId,
          roadmap_id: "roadmap",
          status: "done",
          title: "Week 1",
          updated_at: "2026-05-29T10:00:00Z",
          user_id: "00000000-0000-0000-0000-000000000001",
          week_number: 1,
        },
      },
      { data: [{ status: "done" }, { status: "todo" }] },
    ]);

    const response = await route.PATCH(
      new Request("http://localhost/api/roadmap/items/item", {
        body: JSON.stringify({ status: "done" }),
        method: "PATCH",
      }) as never,
      { params: Promise.resolve({ itemId }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.progress).toBe(50);
    expect(supabase.calls.find((call) => call.mode === "update")?.payload).toMatchObject({
      status: "done",
    });
  });
});
