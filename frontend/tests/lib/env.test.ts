import { describe, expect, it } from "vitest";

import { requiredEnv } from "@/lib/env";

describe("requiredEnv", () => {
  it("returns value when present", () => {
    expect(requiredEnv("TEST_VAR", "hello")).toBe("hello");
  });

  it("throws when value is missing", () => {
    expect(() => requiredEnv("MISSING_VAR", undefined)).toThrow(
      "Missing required environment variable: MISSING_VAR",
    );
    expect(() => requiredEnv("MISSING_VAR", "")).toThrow(
      "Missing required environment variable: MISSING_VAR",
    );
  });
});
