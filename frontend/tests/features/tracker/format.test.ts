import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatRelative,
  getApplicationDeadline,
  getApplicationTitle,
  getCompanyLine,
} from "@/features/tracker/format";

describe("tracker format helpers", () => {
  it("formats dates with fallbacks", () => {
    expect(formatDate(null)).toBe("Not set");
    expect(formatDate("2026-05-15T00:00:00Z")).toBe("May 15, 2026");
    expect(formatRelative("2026-05-28T12:00:00Z")).toContain("ago");
    expect(formatRelative(null)).toBe("No date");
  });

  it("derives application title and company line", () => {
    const app = {
      manual_job_title: null,
      manual_company: null,
      manual_location: null,
      job: { title: "Engineer", company: "Acme", location: "Remote" },
    };

    expect(getApplicationTitle(app)).toBe("Engineer");
    expect(getCompanyLine(app)).toBe("Acme · Remote");
    expect(getCompanyLine({ manual_company: null, manual_location: null, job: null })).toBe(
      "Company not set",
    );
  });

  it("resolves deadline from application or job", () => {
    expect(
      getApplicationDeadline({
        deadline: "2026-06-01",
        job: { deadline: "2026-07-01" } as never,
      }),
    ).toBe("2026-06-01");
  });
});
