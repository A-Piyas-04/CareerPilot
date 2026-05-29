import { describe, expect, it } from "vitest";

import { parseCoverLetterJson } from "./parser";

describe("parseCoverLetterJson", () => {
  it("returns content from fenced JSON", () => {
    expect(parseCoverLetterJson('```json\n{"content":"Dear Hiring Manager..."}\n```')).toEqual({
      content: "Dear Hiring Manager...",
    });
  });

  it("rejects empty or malformed content", () => {
    expect(() => parseCoverLetterJson("{}")).toThrow("content");
    expect(() => parseCoverLetterJson('{"content":"   "}')).toThrow("empty");
  });
});
