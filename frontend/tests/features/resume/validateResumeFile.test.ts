import { describe, expect, it } from "vitest";

import { validateResumeFile } from "@/features/resume/api";

function makeFile(name: string, size: number, type = "application/pdf") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateResumeFile", () => {
  it("accepts valid PDF and DOCX files", () => {
    expect(() => validateResumeFile(makeFile("resume.pdf", 1024))).not.toThrow();
    expect(() => validateResumeFile(makeFile("resume.docx", 1024))).not.toThrow();
  });

  it("rejects unsupported extensions", () => {
    expect(() => validateResumeFile(makeFile("resume.txt", 1024))).toThrow(
      "Only PDF and DOCX files are supported.",
    );
  });

  it("rejects empty and oversized files", () => {
    expect(() => validateResumeFile(makeFile("resume.pdf", 0))).toThrow(
      "The selected file is empty.",
    );
    expect(() =>
      validateResumeFile(makeFile("resume.pdf", 11 * 1024 * 1024)),
    ).toThrow("File is too large");
  });
});
