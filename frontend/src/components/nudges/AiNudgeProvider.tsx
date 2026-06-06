"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { WorkspaceNotification } from "@/components/nudges/types";
import { useWorkspaceNotifications as useWorkspaceNotificationsState } from "@/lib/hooks/useWorkspaceNotifications";

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

export function AiNudgeProvider({ children }: { children: ReactNode }) {
  const value = useWorkspaceNotificationsState();

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

export { useAiNudgeNotifications as useWorkspaceNotifications };
