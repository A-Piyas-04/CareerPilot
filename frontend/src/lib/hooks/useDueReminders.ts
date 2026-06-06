"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchDueReminders, type DueReminder } from "./due-reminders";

export type { DueReminder };

const POLL_MS = 60_000;

export function useDueReminders() {
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setReminders(await fetchDueReminders());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refresh]);

  return {
    isLoading,
    refresh,
    reminders,
  };
}
