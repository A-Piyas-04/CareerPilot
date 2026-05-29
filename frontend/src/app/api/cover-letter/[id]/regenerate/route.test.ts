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

const { createClient } = await import("@/lib/supabase/server");
const { createGeminiText } = await import("@/lib/gemini");
const route = await import("./route");

describe("POST /api/cover-letter/[id]/regenerate", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.mocked(createGeminiText).mockReset();
  });

  it("rejects old rows missing job details needed for regeneration", async () => {
    supabase.setTable("cover_letters", [
      { data: { content: "Old", id: "00000000-0000-4000-8000-000000000001", user_id: "user" } },
    ]);

    const response = await route.POST({} as Request, {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
    });

    expect(response.status).toBe(400);
    expect(createGeminiText).not.toHaveBeenCalled();
  });

  it("creates a new version and preserves the existing row", async () => {
    supabase.setTable("cover_letters", [
      {
        data: {
          company_name: "Acme",
          content: "Old",
          id: "00000000-0000-4000-8000-000000000001",
          job_description: "Python REST API",
          job_id: null,
          job_title: "Backend Intern",
          tone: "professional",
          user_id: "00000000-0000-0000-0000-000000000001",
          version: 1,
        },
      },
      { data: [{ version: 1 }] },
      {
        data: {
          company_name: "Acme",
          content: "New",
          id: "00000000-0000-4000-8000-000000000099",
          job_description: "Python REST API",
          job_title: "Backend Intern",
          user_id: "00000000-0000-0000-0000-000000000001",
          version: 2,
        },
      },
    ]);
    supabase.setTable("profiles", [{ data: { full_name: "John Doe" } }]);
    supabase.setTable("resumes", [{ data: null }]);
    vi.mocked(createGeminiText).mockResolvedValue(JSON.stringify({ content: "New" }));

    const response = await route.POST({} as Request, {
      params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.coverLetter.version).toBe(2);
    expect(supabase.calls.some((call) => call.mode === "delete")).toBe(false);
  });
});
