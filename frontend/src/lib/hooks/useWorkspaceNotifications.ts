"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  aiNotificationId,
  reminderNotificationId,
  type WorkspaceNotification,
} from "@/components/nudges/types";
import {
  readPanelDismissedNotifications,
  readToastDismissedNotifications,
  writePanelDismissedNotifications,
  writeToastDismissedNotifications,
} from "@/lib/nudges/notification-storage";
import type { AiNudge } from "@/lib/reminders/types";

import { fetchDueReminders, type DueReminder } from "./due-reminders";
import { useAiNudges } from "./useAiNudges";

const REMINDER_POLL_MS = 60_000;

function sortNotifications(items: WorkspaceNotification[]) {
  return [...items].sort((a, b) => {
    if (a.sortKey !== b.sortKey) {
      return a.sortKey - b.sortKey;
    }
    if (a.kind !== b.kind) {
      return a.kind === "due-reminder" ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });
}

function mapDueReminders(reminders: DueReminder[]): WorkspaceNotification[] {
  return reminders.map((reminder) => ({
    actionHref: reminder.actionHref,
    actionLabel: reminder.actionLabel,
    id: reminderNotificationId(reminder.id),
    kind: "due-reminder",
    message: reminder.message,
    sortKey: new Date(reminder.dueAt).getTime(),
    title: reminder.title,
  }));
}

function mapAiNudges(nudges: AiNudge[]): WorkspaceNotification[] {
  return nudges.map((nudge) => ({
    actionHref: nudge.actionHref,
    actionLabel: nudge.actionLabel,
    id: aiNotificationId(nudge.id),
    kind: "ai-nudge",
    message: nudge.message,
    sortKey: Number.MAX_SAFE_INTEGER,
    title: nudge.title,
  }));
}

export function useWorkspaceNotifications() {
  const [panelDismissed, setPanelDismissed] = useState<Set<string>>(
    () => new Set(),
  );
  const [toastDismissed, setToastDismissed] = useState<Set<string>>(
    () => new Set(),
  );
  const [mounted, setMounted] = useState(false);
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);

  const {
    error,
    generatedAt,
    isLoading: isLoadingNudges,
    nudges,
    refreshNudges,
  } = useAiNudges();

  const refreshReminders = useCallback(async () => {
    setIsLoadingReminders(true);
    try {
      setReminders(await fetchDueReminders());
    } finally {
      setIsLoadingReminders(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPanelDismissed(readPanelDismissedNotifications());
      setToastDismissed(readToastDismissedNotifications());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refreshReminders();
    }, 0);
    const timer = window.setInterval(() => {
      void refreshReminders();
    }, REMINDER_POLL_MS);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refreshReminders]);

  const allNotifications = useMemo(() => {
    if (!mounted) {
      return [];
    }

    return sortNotifications([
      ...mapDueReminders(reminders),
      ...mapAiNudges(nudges),
    ]);
  }, [mounted, nudges, reminders]);

  const panelNotifications = useMemo(
    () => allNotifications.filter((item) => !panelDismissed.has(item.id)),
    [allNotifications, panelDismissed],
  );

  const toastNotification = useMemo(
    () =>
      panelNotifications.find((item) => !toastDismissed.has(item.id)) ?? null,
    [panelNotifications, toastDismissed],
  );

  const dismissFromPanel = useCallback((id: string) => {
    setPanelDismissed((current) => {
      const next = new Set(current);
      next.add(id);
      writePanelDismissedNotifications(next);
      return next;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastDismissed((current) => {
      const next = new Set(current);
      next.add(id);
      writeToastDismissedNotifications(next);
      return next;
    });
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshNudges(), refreshReminders()]);
  }, [refreshNudges, refreshReminders]);

  return {
    dismissFromPanel,
    dismissToast,
    error,
    generatedAt,
    isLoading: isLoadingNudges || isLoadingReminders,
    panelNotifications,
    refreshNudges: refreshAll,
    toastNotification,
  };
}
