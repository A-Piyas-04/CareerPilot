"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAiNudges } from "@/lib/hooks/useAiNudges";
import {
  readDismissedNudges,
  writeDismissedNudges,
} from "@/lib/nudges/dismiss-storage";
import type { AiNudge } from "@/lib/reminders/types";

type AiNudgeContextValue = {
  activeNudges: AiNudge[];
  dismissNudge: (id: string) => void;
  error: string | null;
  generatedAt: string | null;
  isLoading: boolean;
  refreshNudges: () => Promise<void>;
};

const AiNudgeContext = createContext<AiNudgeContextValue | null>(null);

export function AiNudgeProvider({ children }: { children: ReactNode }) {
  const { error, generatedAt, isLoading, nudges, refreshNudges } =
    useAiNudges();
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(
    () => new Set(),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDismissedNudges(readDismissedNudges());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const dismissNudge = useCallback((id: string) => {
    setDismissedNudges((current) => {
      const next = new Set(current);
      next.add(id);
      writeDismissedNudges(next);
      return next;
    });
  }, []);

  const activeNudges = useMemo(
    () => (mounted ? nudges.filter((nudge) => !dismissedNudges.has(nudge.id)) : []),
    [dismissedNudges, mounted, nudges],
  );

  const value = useMemo<AiNudgeContextValue>(
    () => ({
      activeNudges,
      dismissNudge,
      error,
      generatedAt,
      isLoading,
      refreshNudges,
    }),
    [
      activeNudges,
      dismissNudge,
      error,
      generatedAt,
      isLoading,
      refreshNudges,
    ],
  );

  return (
    <AiNudgeContext.Provider value={value}>{children}</AiNudgeContext.Provider>
  );
}

export function useAiNudgeNotifications() {
  const context = useContext(AiNudgeContext);
  if (!context) {
    throw new Error(
      "useAiNudgeNotifications must be used within AiNudgeProvider",
    );
  }
  return context;
}
