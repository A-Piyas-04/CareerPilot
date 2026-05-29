import { describe, expect, it } from "vitest";

import { FakeSupabase } from "@/test/fakeSupabase";

import {
  buildCoverLetterTitle,
  fetchCoverLetterForUser,
  nextCoverLetterVersion,
  normalizeCoverLetter,
  resolveJobContext,
} from "./server";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const JOB_ID = "00000000-0000-4000-8000-000000000002";

describe("cover-letter server helpers", () => {
  it("normalizes rows and title compatibility", () => {
    expect(buildCoverLetterTitle(" ML Engineer ", " Acme ")).toBe(
      "ML Engineer at Acme",
    );
    expect(
      normalizeCoverLetter({
        content: "Text",
        id: "id",
        tone: "enthusiastic",
        user_id: USER_ID,
        version: "2",
      }),
    ).toMatchObject({
      content: "Text",
      tone: "enthusiastic",
      version: 2,
    });
  });

  it("fetches a user-owned cover letter", async () => {
    const supabase = new FakeSupabase();
    supabase.setTable("cover_letters", [
      { data: { content: "Letter", id: "letter", user_id: USER_ID, version: 1 } },
    ]);

    await expect(
      fetchCoverLetterForUser(supabase as never, "letter", USER_ID),
    ).resolves.toMatchObject({ content: "Letter", id: "letter" });

    expect(supabase.calls[0].filters).toEqual([
      ["id", "letter"],
      ["user_id", USER_ID],
    ]);
  });

  it("verifies job ownership through matches before loading job details", async () => {
    const supabase = new FakeSupabase();
    supabase.setTable("job_matches", [{ data: { id: "match" } }]);
    supabase.setTable("applications", [{ data: null }]);
    supabase.setTable("jobs", [
      {
        data: {
          id: JOB_ID,
          title: "ML Engineer",
          company: "Acme",
          description: "Python",
          requirements: "REST",
        },
      },
    ]);

    await expect(
      resolveJobContext({ jobId: JOB_ID, supabase: supabase as never, userId: USER_ID }),
    ).resolves.toMatchObject({ company: "Acme", title: "ML Engineer" });
  });

  it("calculates next version by job id or job/company", async () => {
    const supabase = new FakeSupabase();
    supabase.setTable("cover_letters", [{ data: [{ version: 1 }, { version: 3 }] }]);

    await expect(
      nextCoverLetterVersion({
        companyName: "Acme",
        jobId: JOB_ID,
        jobTitle: "ML Engineer",
        supabase: supabase as never,
        userId: USER_ID,
      }),
    ).resolves.toBe(4);
  });
});
