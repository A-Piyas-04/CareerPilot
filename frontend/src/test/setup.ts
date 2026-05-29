import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: vi.fn(() => "00000000-0000-4000-8000-000000000001"),
    },
  });
}

window.alert = vi.fn();
