import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import(
  "@/app/api/roadmap/items/[itemId]/create-task/route"
);

const ITEM_ID = "00000000-0000-4000-8000-000000000002";

describe("POST /api/roadmap/items/[itemId]/create-task", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
  });

  it("rejects invalid item id", async () => {
    const response = await route.POST({} as Request, {
      params: Promise.resolve({ itemId: "bad" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns existing task when one already exists", async () => {
    supabase.setTable("roadmap_items", [
      {
        data: {
          id: ITEM_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          title: "Study Python",
          description: "Learn basics",
          due_date: null,
        },
      },
    ]);
    supabase.setTable("tasks", [
      {
        data: {
          id: "task-existing",
          roadmap_item_id: ITEM_ID,
          title: "Study Python",
          status: "todo",
        },
      },
    ]);

    const response = await route.POST({} as Request, {
      params: Promise.resolve({ itemId: ITEM_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.created).toBe(false);
    expect(body.task.id).toBe("task-existing");
  });

  it("creates a new task from roadmap item", async () => {
    supabase.setTable("roadmap_items", [
      {
        data: {
          id: ITEM_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          title: "Build project",
          description: "Portfolio piece",
          due_date: "2026-06-01",
        },
      },
    ]);
    supabase.setTable("tasks", [
      { data: null },
      {
        data: {
          id: "task-new",
          roadmap_item_id: ITEM_ID,
          title: "Build project",
          status: "todo",
        },
      },
    ]);

    const response = await route.POST({} as Request, {
      params: Promise.resolve({ itemId: ITEM_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.created).toBe(true);
    expect(body.task.title).toBe("Build project");
  });
});
