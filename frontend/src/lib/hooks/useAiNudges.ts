"use client";

import { format } from "date-fns";
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

const CACHE_PREFIX = "careerpilot_nudges_";

export function useAiNudges() {
  const [cacheKey] = useState(() => todayCacheKey());
  const [state, setState] = useState<AiNudgeState>(() =>
    initialNudgeState(cacheKey),
  );

  const refreshNudges = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
      errorCode: null,
      isCached: false,
      isLoading: true,
      nudges: [],
    }));

    const nextState = await requestNudges(cacheKey, true);
    setState(nextState);
  }, [cacheKey]);

  useEffect(() => {
    if (!state.isLoading || state.generatedAt || state.nudges.length > 0) {
      return;
    }

    let isActive = true;
    void requestNudges(cacheKey, false).then((nextState) => {
      if (isActive) {
        setState(nextState);
      }
    });

    return () => {
      isActive = false;
    };
  }, [cacheKey, state.generatedAt, state.isLoading, state.nudges.length]);

  return {
    ...state,
    refreshNudges,
  };
}

async function requestNudges(
  cacheKey: string,
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

    localStorage.setItem(cacheKey, JSON.stringify(payload));
    return {
      error: null,
      errorCode: null,
      generatedAt: payload.generatedAt,
      isCached: false,
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

function todayCacheKey() {
  return `${CACHE_PREFIX}${format(new Date(), "yyyy-MM-dd")}`;
}

function initialNudgeState(cacheKey: string): AiNudgeState {
  const cached = readCachedNudges(cacheKey);

  if (cached) {
    return {
      error: null,
      errorCode: null,
      generatedAt: cached.generatedAt,
      isCached: true,
      isLoading: false,
      nudges: cached.nudges,
    };
  }

  return {
    error: null,
    errorCode: null,
    generatedAt: null,
    isCached: false,
    isLoading: true,
    nudges: [],
  };
}

function readCachedNudges(cacheKey: string): AiNudgeResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AiNudgeResponse>;
    if (!Array.isArray(parsed.nudges) || typeof parsed.generatedAt !== "string") {
      return null;
    }

    return {
      cached: true,
      generatedAt: parsed.generatedAt,
      nudges: parsed.nudges,
    };
  } catch {
    return null;
  }
}
