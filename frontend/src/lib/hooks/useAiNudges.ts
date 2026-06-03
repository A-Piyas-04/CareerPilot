"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AiNudge,
  AiNudgeErrorCode,
  AiNudgeErrorResponse,
  AiNudgeResponse,
} from "@/lib/reminders/types";

type AiNudgeState = {
  nudges: AiNudge[];
  generatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  errorCode: AiNudgeErrorCode | null;
  isCached: boolean;
};

export function useAiNudges() {
  const [state, setState] = useState<AiNudgeState>(() => initialNudgeState());

  const refreshNudges = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
      errorCode: null,
      isCached: false,
      isLoading: true,
      nudges: [],
    }));

    const nextState = await requestNudges(true);
    setState(nextState);
  }, []);

  useEffect(() => {
    if (!state.isLoading || state.generatedAt || state.nudges.length > 0) {
      return;
    }

    let isActive = true;
    void requestNudges(false).then((nextState) => {
      if (isActive) {
        setState(nextState);
      }
    });

    return () => {
      isActive = false;
    };
  }, [state.generatedAt, state.isLoading, state.nudges.length]);

  return {
    ...state,
    refreshNudges,
  };
}

async function requestNudges(
  force: boolean,
): Promise<AiNudgeState> {
  try {
    const response = await fetch("/api/reminders/generate", {
      body: JSON.stringify({ force }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as
      | AiNudgeResponse
      | AiNudgeErrorResponse;

    if (!response.ok || "error" in payload) {
      const errorPayload = payload as AiNudgeErrorResponse;
      return {
        error: errorPayload.message || "Could not generate AI nudges right now.",
        errorCode: errorPayload.error || "nudge_generation_failed",
        generatedAt: null,
        isCached: false,
        isLoading: false,
        nudges: [],
      };
    }

    return {
      error: null,
      errorCode: null,
      generatedAt: payload.generatedAt,
      isCached: payload.cached,
      isLoading: false,
      nudges: payload.nudges,
    };
  } catch {
    return {
      error: "Could not generate AI nudges right now. Please try again later.",
      errorCode: "nudge_generation_failed",
      generatedAt: null,
      isCached: false,
      isLoading: false,
      nudges: [],
    };
  }
}

function initialNudgeState(): AiNudgeState {
  return {
    error: null,
    errorCode: null,
    generatedAt: null,
    isCached: false,
    isLoading: true,
    nudges: [],
  };
}
