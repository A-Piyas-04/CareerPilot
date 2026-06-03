import { describe, expect, it } from "vitest";

import {
  getPageStatusBadge,
  normalizeBuilderSectionName,
  pickPrimaryResume,
  truncateText,
} from "@/features/resume/types";
import type { Resume } from "@/features/resume/types";

function makeResume(overrides: Partial<Resume>): Resume {
  return {
    id: "r1",
    user_id: "u1",
    file_name: "cv.pdf",
    file_type: "application/pdf",
    is_active: false,
    status: "processed",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("resume type helpers", () => {
  it("normalizes builder section names", () => {
    expect(normalizeBuilderSectionName("experience")).toBe("experience");
    expect(normalizeBuilderSectionName(" Unknown ")).toBe("summary");
  });

  it("picks active resume or first fallback", () => {
    const resumes = [
      makeResume({ id: "a", is_active: false }),
      makeResume({ id: "b", is_active: true }),
    ];
    expect(pickPrimaryResume(resumes)?.id).toBe("b");
    expect(pickPrimaryResume([makeResume({ id: "only" })])?.id).toBe("only");
    expect(pickPrimaryResume([])).toBeNull();
  });

  it("truncates long text with ellipsis", () => {
    expect(truncateText("short")).toBe("short");
    expect(truncateText("a".repeat(150), 120)).toContain("…");
  });

  it("derives page status badge from resume list", () => {
    expect(getPageStatusBadge([])).toBe("no_cv");
    expect(
      getPageStatusBadge([makeResume({ status: "processing" })]),
    ).toBe("processing");
    expect(getPageStatusBadge([makeResume({ status: "failed" })])).toBe("failed");
    expect(getPageStatusBadge([makeResume({ status: "processed" })])).toBe(
      "rag_ready",
    );
  });
});
