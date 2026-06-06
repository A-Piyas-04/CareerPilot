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

import {
  aiNotificationId,
  reminderNotificationId,
  type WorkspaceNotification,
} from "@/components/nudges/types";
import { useAiNudges } from "@/lib/hooks/useAiNudges";
import { useDueReminders } from "@/lib/hooks/useDueReminders";
import {
  readPanelDismissedNotifications,
  readToastDismissedNotifications,
  writePanelDismissedNotifications,
  writeToastDismissedNotifications,
} from "@/lib/nudges/notification-storage";

type WorkspaceNotificationsContextValue = {
  panelNotifications: WorkspaceNotification[];
  toastNotification: WorkspaceNotification | null;
  dismissFromPanel: (id: string) => void;
  dismissToast: (id: string) => void;
  error: string | null;
  generatedAt: string | null;
  isLoading: boolean;
  refreshNudges: () => Promise<void>;
};

const WorkspaceNotificationsContext =
  createContext<WorkspaceNotificationsContextValue | null>(null);

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

export function AiNudgeProvider({ children }: { children: ReactNode }) {
  const { error, generatedAt, isLoading, nudges, refreshNudges } =
    useAiNudges();
  const {
    isLoading: isLoadingReminders,
    refresh: refreshReminders,
    reminders,
  } = useDueReminders();
  const [panelDismissed, setPanelDismissed] = useState<Set<string>>(
    () => new Set(),
  );
  const [toastDismissed, setToastDismissed] = useState<Set<string>>(
    () => new Set(),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPanelDismissed(readPanelDismissedNotifications());
      setToastDismissed(readToastDismissedNotifications());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const allNotifications = useMemo(() => {
    if (!mounted) {
      return [];
    }

    const dueReminderNotifications: WorkspaceNotification[] = reminders.map(
      (reminder) => ({
        actionHref: reminder.actionHref,
        actionLabel: reminder.actionLabel,
        id: reminderNotificationId(reminder.id),
        kind: "due-reminder",
        message: reminder.message,
        sortKey: new Date(reminder.dueAt).getTime(),
        title: reminder.title,
      }),
    );

    const aiNotifications: WorkspaceNotification[] = nudges.map((nudge) => ({
      actionHref: nudge.actionHref,
      actionLabel: nudge.actionLabel,
      id: aiNotificationId(nudge.id),
      kind: "ai-nudge",
      message: nudge.message,
      sortKey: Number.MAX_SAFE_INTEGER,
      title: nudge.title,
    }));

    return sortNotifications([
      ...dueReminderNotifications,
      ...aiNotifications,
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

  const value = useMemo<WorkspaceNotificationsContextValue>(
    () => ({
      dismissFromPanel,
      dismissToast,
      error,
      generatedAt,
      isLoading: isLoading || isLoadingReminders,
      panelNotifications,
      refreshNudges: refreshAll,
      toastNotification,
    }),
    [
      dismissFromPanel,
      dismissToast,
      error,
      generatedAt,
      isLoading,
      isLoadingReminders,
      panelNotifications,
      refreshAll,
      toastNotification,
    ],
  );

  return (
    <WorkspaceNotificationsContext.Provider value={value}>
      {children}
    </WorkspaceNotificationsContext.Provider>
  );
}

export function useAiNudgeNotifications() {
  const context = useContext(WorkspaceNotificationsContext);
  if (!context) {
    throw new Error(
      "useAiNudgeNotifications must be used within AiNudgeProvider",
    );
  }
  return context;
}

export function useWorkspaceNotifications() {
  return useAiNudgeNotifications();
}
