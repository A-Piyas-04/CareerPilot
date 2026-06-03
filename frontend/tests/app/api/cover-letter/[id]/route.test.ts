import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { createClient } = await import("@/lib/supabase/server");
const route = await import("@/app/api/cover-letter/[id]/route");

const LETTER_ID = "00000000-0000-4000-8000-000000000001";

describe("cover letter detail route", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
  });

  it("GET rejects invalid id", async () => {
    const response = await route.GET({} as Request, {
      params: Promise.resolve({ id: "bad-id" }),
    });
    expect(response.status).toBe(400);
  });

  it("GET returns cover letter detail", async () => {
    supabase.setTable("cover_letters", [
      {
        data: {
          id: LETTER_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          content: "Letter body",
          job_title: "Engineer",
          company_name: "Acme",
          tone: "professional",
          version: 1,
        },
      },
    ]);

    const response = await route.GET({} as Request, {
      params: Promise.resolve({ id: LETTER_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.coverLetter.content).toBe("Letter body");
  });

  it("PATCH validates empty content", async () => {
    supabase.setTable("cover_letters", [
      {
        data: {
          id: LETTER_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          content: "Old",
          job_title: "Engineer",
          company_name: "Acme",
          tone: "professional",
          version: 1,
        },
      },
    ]);

    const response = await route.PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "   " }),
      }) as never,
      { params: Promise.resolve({ id: LETTER_ID }) },
    );

    expect(response.status).toBe(400);
  });

  it("PATCH updates cover letter fields", async () => {
    supabase.setTable("cover_letters", [
      {
        data: {
          id: LETTER_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          content: "Old",
          job_title: "Engineer",
          company_name: "Acme",
          tone: "professional",
          version: 1,
        },
      },
      {
        data: {
          id: LETTER_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          content: "Updated body",
          job_title: "Engineer",
          company_name: "Acme",
          title: "Engineer at Acme",
          tone: "concise",
          version: 1,
        },
      },
    ]);

    const response = await route.PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ content: "Updated body", tone: "concise" }),
      }) as never,
      { params: Promise.resolve({ id: LETTER_ID }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.coverLetter.content).toBe("Updated body");
    expect(body.coverLetter.tone).toBe("concise");
  });

  it("DELETE removes cover letter", async () => {
    supabase.setTable("cover_letters", [
      {
        data: {
          id: LETTER_ID,
          user_id: "00000000-0000-0000-0000-000000000001",
          content: "Letter",
          version: 1,
        },
      },
      { data: null },
    ]);

    const response = await route.DELETE({} as Request, {
      params: Promise.resolve({ id: LETTER_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(supabase.calls.some((c) => c.mode === "delete")).toBe(true);
  });
});
