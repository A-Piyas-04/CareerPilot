import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_DESTINATION,
  getDestinationFromLoginHref,
  sanitizeNextPath,
} from "@/lib/auth/login-redirect";

describe("sanitizeNextPath", () => {
  it("returns default for null, empty, or external paths", () => {
    expect(sanitizeNextPath(null)).toBe(DEFAULT_AUTH_DESTINATION);
    expect(sanitizeNextPath(undefined)).toBe(DEFAULT_AUTH_DESTINATION);
    expect(sanitizeNextPath("")).toBe(DEFAULT_AUTH_DESTINATION);
    expect(sanitizeNextPath("https://evil.com")).toBe(DEFAULT_AUTH_DESTINATION);
    expect(sanitizeNextPath("//evil.com")).toBe(DEFAULT_AUTH_DESTINATION);
  });

  it("preserves valid internal paths", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("/tracker?applicationId=1")).toBe(
      "/tracker?applicationId=1",
    );
  });
});

describe("getDestinationFromLoginHref", () => {
  it("extracts next param from login href", () => {
    expect(getDestinationFromLoginHref("/login?next=/goals")).toBe("/goals");
    expect(getDestinationFromLoginHref("/login")).toBe(DEFAULT_AUTH_DESTINATION);
  });

  it("falls back to default on invalid href", () => {
    expect(getDestinationFromLoginHref("")).toBe(DEFAULT_AUTH_DESTINATION);
  });
});
