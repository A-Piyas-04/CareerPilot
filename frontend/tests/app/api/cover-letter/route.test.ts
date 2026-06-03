import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import("@/app/api/cover-letter/route");

describe("GET /api/cover-letter", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
  });

  it("returns normalized cover letters for authenticated user", async () => {
    supabase.setTable("cover_letters", [
      {
        data: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            user_id: "00000000-0000-0000-0000-000000000001",
            title: "Engineer at Acme",
            content: "Dear Hiring Manager",
            job_title: "Engineer",
            company_name: "Acme",
            tone: "professional",
            version: 1,
            updated_at: "2026-05-29T10:00:00Z",
            created_at: "2026-05-29T10:00:00Z",
          },
        ],
      },
    ]);

    const response = await route.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.coverLetters[0]).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      title: "Engineer at Acme",
      version: 1,
    });
    expect(supabase.calls[0].filters).toEqual([
      ["user_id", "00000000-0000-0000-0000-000000000001"],
    ]);
  });

  it("returns 500 on database error", async () => {
    supabase.setTable("cover_letters", [{ error: { message: "db error" } }]);

    const response = await route.GET();
    expect(response.status).toBe(500);
  });
});
