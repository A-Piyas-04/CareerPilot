import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/lib/api-server", () => ({
  serverApiRequest: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const { serverApiRequest } = await import("@/lib/api-server");
const { createClient } = await import("@/lib/supabase/server");
const { getResumeContext } = await import("./getResumeContext");

describe("getResumeContext", () => {
  let supabase: FakeSupabase;

  beforeEach(() => {
    supabase = new FakeSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as never);
    vi.mocked(serverApiRequest).mockReset();
  });

  it("uses latest Supabase resume text when backend RAG reports no CV", async () => {
    vi.mocked(serverApiRequest).mockResolvedValue({
      resume_id: null,
      resume_status: null,
      has_resume: false,
      chunks: [],
      chunk_ids: [],
      context_text: "",
      user_skills: [],
      empty_reason: "No processed resume found.",
    });
    supabase.setTable("resumes", [
      {
        data: [
          {
            id: "resume-1",
            file_name: "Nuren CV.pdf",
            raw_text: "Skills: TypeScript, Python, FastAPI.",
            status: "processed",
            is_active: false,
            created_at: "2026-06-01T00:00:00.000Z",
          },
        ],
      },
    ]);
    supabase.setTable("resume_sections", [{ data: [] }]);
    supabase.setTable("user_skills", [
      { data: [{ skill_name: "Python" }, { skill_name: "FastAPI" }] },
    ]);

    const result = await getResumeContext({
      accessToken: "token",
      query: "What are my skills?",
      userId: "user-1",
    });

    expect(result.hasResume).toBe(true);
    expect(result.resumeId).toBe("resume-1");
    expect(result.text).toContain("TypeScript");
    expect(result.userSkills).toEqual(["Python", "FastAPI"]);
  });
});
