import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({
  GEMINI_MODEL: "gemini-test",
  GeminiApiError: class GeminiApiError extends Error {
    status = 500;
  },
  createGeminiText: vi.fn(),
}));

vi.mock("@/lib/assistant/getResumeContext", () => ({
  getResumeContext: vi.fn(async () => ({
    text: "Skills: Python, FastAPI, PostgreSQL.",
    usedResumeChunks: ["mock-chunk"],
  })),
}));

const { createClient } = await import("@/lib/supabase/server");
const { createGeminiText } = await import("@/lib/gemini");
const route = await import("./route");

describe("POST /api/roadmap/generate", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.mocked(createGeminiText).mockReset();
  });

  it("validates duration before generation", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/roadmap/generate", {
        body: JSON.stringify({ durationWeeks: 5, targetRole: "ML Engineer" }),
        method: "POST",
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(createGeminiText).not.toHaveBeenCalled();
  });

  it("saves roadmap and exact weekly items from Gemini JSON", async () => {
    supabase.setTable("profiles", [{ data: { target_role: "ML Engineer" } }]);
    supabase.setTable("resumes", [{ data: null }]);
    supabase.setTable("roadmaps", [
      {
        data: {
          created_at: "2026-05-29T10:00:00Z",
          duration_weeks: 4,
          id: "roadmap-id",
          overview: "Plan",
          progress_percent: 0,
          resume_id: null,
          target_role: "ML Engineer",
          updated_at: "2026-05-29T10:00:00Z",
          user_id: "00000000-0000-0000-0000-000000000001",
        },
      },
    ]);
    supabase.setTable("roadmap_items", [
      {
        data: [1, 2, 3, 4].map((week) => ({
          created_at: "2026-05-29T10:00:00Z",
          description: `Deliverable ${week}`,
          id: `item-${week}`,
          resources: [],
          roadmap_id: "roadmap-id",
          status: "todo",
          title: `Week ${week}`,
          updated_at: "2026-05-29T10:00:00Z",
          user_id: "00000000-0000-0000-0000-000000000001",
          week_number: week,
        })),
      },
    ]);
    vi.mocked(createGeminiText).mockResolvedValue(
      JSON.stringify({
        overview: "Plan",
        items: [1, 2, 3, 4].map((week) => ({
          description: `Deliverable ${week}`,
          resources: [],
          title: `Week ${week}`,
          week_number: week,
        })),
      }),
    );

    const response = await route.POST(
      new Request("http://localhost/api/roadmap/generate", {
        body: JSON.stringify({ durationWeeks: 4, targetRole: "ML Engineer" }),
        method: "POST",
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(4);
    expect(supabase.calls.find((call) => call.table === "roadmap_items")?.payload).toHaveLength(4);
  });
});
