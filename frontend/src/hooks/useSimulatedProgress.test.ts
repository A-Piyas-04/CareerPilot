import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSimulatedProgress } from "./useSimulatedProgress";

describe("useSimulatedProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at index 0 when active", () => {
    const { result } = renderHook(() =>
      useSimulatedProgress({
        isActive: true,
        steps: ["A", "B", "C"],
        intervalMs: 1000,
      }),
    );

    expect(result.current.activeIndex).toBe(0);
    expect(result.current.currentLabel).toBe("A");
  });

  it("advances steps on interval and clamps at last", () => {
    const { result } = renderHook(() =>
      useSimulatedProgress({
        isActive: true,
        steps: ["A", "B", "C"],
        intervalMs: 1000,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.activeIndex).toBe(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.activeIndex).toBe(2);
    expect(result.current.currentLabel).toBe("C");
  });

  it("resets when isActive becomes false", () => {
    const { result, rerender } = renderHook(
      ({ isActive }: { isActive: boolean }) =>
        useSimulatedProgress({
          isActive,
          steps: ["A", "B"],
          intervalMs: 500,
        }),
      { initialProps: { isActive: true } },
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.activeIndex).toBe(1);

    rerender({ isActive: false });
    expect(result.current.activeIndex).toBe(0);
  });
});
