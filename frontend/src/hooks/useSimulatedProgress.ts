"use client";

import { useEffect, useReducer } from "react";

type UseSimulatedProgressOptions = {
  isActive: boolean;
  steps: string[];
  intervalMs?: number;
};

type ProgressState = {
  active: boolean;
  index: number;
};

type ProgressAction =
  | { type: "sync"; isActive: boolean }
  | { type: "tick"; maxIndex: number };

function progressReducer(
  state: ProgressState,
  action: ProgressAction,
): ProgressState {
  switch (action.type) {
    case "sync":
      if (!action.isActive) {
        return { active: false, index: 0 };
      }
      if (!state.active) {
        return { active: true, index: 0 };
      }
      return state;
    case "tick":
      return {
        ...state,
        index: Math.min(state.index + 1, action.maxIndex),
      };
    default:
      return state;
  }
}

export function useSimulatedProgress({
  isActive,
  steps,
  intervalMs = 2500,
}: UseSimulatedProgressOptions) {
  const [state, dispatch] = useReducer(progressReducer, {
    active: false,
    index: 0,
  });

  useEffect(() => {
    dispatch({ type: "sync", isActive });
  }, [isActive]);

  useEffect(() => {
    if (!isActive || steps.length <= 1) {
      return;
    }

    const maxIndex = steps.length - 1;
    const timer = window.setInterval(() => {
      dispatch({ type: "tick", maxIndex });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isActive, steps.length, intervalMs]);

  const clampedIndex = isActive
    ? Math.min(state.index, Math.max(0, steps.length - 1))
    : 0;
  const currentLabel = steps[clampedIndex] ?? "";

  return {
    activeIndex: clampedIndex,
    currentLabel,
    totalSteps: steps.length,
  };
}
