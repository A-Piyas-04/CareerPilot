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
  readPanelDismissedNudges,
  readToastDismissedNudges,
  writePanelDismissedNudges,
  writeToastDismissedNudges,
} from "@/lib/nudges/dismiss-storage";
import type { AiNudge } from "@/lib/reminders/types";

type AiNudgeContextValue = {
  panelNudges: AiNudge[];
  toastNudge: AiNudge | null;
  dismissFromPanel: (id: string) => void;
  dismissToast: (id: string) => void;
  error: string | null;
  generatedAt: string | null;
  isLoading: boolean;
  refreshNudges: () => Promise<void>;
};

const AiNudgeContext = createContext<AiNudgeContextValue | null>(null);

export function AiNudgeProvider({ children }: { children: ReactNode }) {
  const { error, generatedAt, isLoading, nudges, refreshNudges } =
    useAiNudges();
  const [panelDismissed, setPanelDismissed] = useState<Set<string>>(
    () => new Set(),
  );
  const [toastDismissed, setToastDismissed] = useState<Set<string>>(
    () => new Set(),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPanelDismissed(readPanelDismissedNudges());
      setToastDismissed(readToastDismissedNudges());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const dismissFromPanel = useCallback((id: string) => {
    setPanelDismissed((current) => {
      const next = new Set(current);
      next.add(id);
      writePanelDismissedNudges(next);
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastDismissed((current) => {
      const next = new Set(current);
      next.add(id);
      writeToastDismissedNudges(next);
      return next;
    });
  }, []);

  const panelNudges = useMemo(
    () =>
      mounted
        ? nudges.filter((nudge) => !panelDismissed.has(nudge.id))
        : [],
    [mounted, nudges, panelDismissed],
  );

  const toastNudge = useMemo(() => {
    if (!mounted) {
      return null;
    }

    return (
      nudges.find(
        (nudge) =>
          !panelDismissed.has(nudge.id) && !toastDismissed.has(nudge.id),
      ) ?? null
    );
  }, [mounted, nudges, panelDismissed, toastDismissed]);

  const value = useMemo<AiNudgeContextValue>(
    () => ({
      dismissFromPanel,
      dismissToast,
      error,
      generatedAt,
      isLoading,
      panelNudges,
      refreshNudges,
      toastNudge,
    }),
    [
      dismissFromPanel,
      dismissToast,
      error,
      generatedAt,
      isLoading,
      panelNudges,
      refreshNudges,
      toastNudge,
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
