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

describe("POST /api/cover-letter/generate", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.mocked(createGeminiText).mockReset();
  });

  it("validates required manual job fields before calling Gemini", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/cover-letter/generate", {
        body: JSON.stringify({ companyName: "Acme", jobDescription: "JD" }),
        method: "POST",
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(createGeminiText).not.toHaveBeenCalled();
  });

  it("generates and saves a grounded cover letter", async () => {
    supabase.setTable("profiles", [{ data: { full_name: "John Doe" } }]);
    supabase.setTable("resumes", [
      {
        data: {
          id: "00000000-0000-4000-8000-000000000010",
          raw_text: "Skills: Python, FastAPI, PostgreSQL. Backend intern.",
        },
      },
    ]);
    supabase.setTable("cover_letters", [
      {
        data: {
          company_name: "Acme Corp",
          content: "Dear Hiring Manager...",
          id: "letter-id",
          job_description: "Python, SQL, PyTorch, REST API",
          job_title: "ML Engineer Intern",
          title: "ML Engineer Intern at Acme Corp",
          tone: "professional",
          user_id: "00000000-0000-0000-0000-000000000001",
          version: 1,
        },
      },
    ]);
    vi.mocked(createGeminiText).mockResolvedValue(
      JSON.stringify({ content: "Dear Hiring Manager..." }),
    );

    const response = await route.POST(
      new Request("http://localhost/api/cover-letter/generate", {
        body: JSON.stringify({
          companyName: "Acme Corp",
          jobDescription: "Python, SQL, PyTorch, REST API",
          jobTitle: "ML Engineer Intern",
          tone: "professional",
        }),
        method: "POST",
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.coverLetter).toMatchObject({
      company_name: "Acme Corp",
      content: "Dear Hiring Manager...",
      job_title: "ML Engineer Intern",
      version: 1,
    });
    const insert = supabase.calls.find((call) => call.table === "cover_letters");
    expect(insert?.payload).toMatchObject({
      company_name: "Acme Corp",
      content: "Dear Hiring Manager...",
      job_description: "Python, SQL, PyTorch, REST API",
      job_title: "ML Engineer Intern",
      version: 1,
    });
  });

  it("does not save a fake cover letter when every Gemini fallback model fails", async () => {
    supabase.setTable("profiles", [{ data: { full_name: "John Doe" } }]);
    supabase.setTable("resumes", [
      {
        data: {
          id: "00000000-0000-4000-8000-000000000010",
          raw_text: "Skills: Python, FastAPI, PostgreSQL. Backend intern.",
        },
      },
    ]);
    vi.mocked(createGeminiText).mockRejectedValue(
      new GeminiApiError("Quota exceeded across all configured models", 429),
    );

    const response = await route.POST(
      new Request("http://localhost/api/cover-letter/generate", {
        body: JSON.stringify({
          companyName: "Acme Corp",
          jobDescription: "Python, SQL, PyTorch, REST API",
          jobTitle: "ML Engineer Intern",
          tone: "professional",
        }),
        method: "POST",
      }) as never,
    );

    expect(response.status).toBe(429);
    expect(
      supabase.calls.some(
        (call) => call.table === "cover_letters" && call.mode === "insert",
      ),
    ).toBe(false);
  });
});
