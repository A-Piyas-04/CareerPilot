"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  AiNudgeProvider,
  AiNudgeToast,
} from "@/components/nudges";

import { AppFooterScrollRegion } from "./AppFooter";
import { AppSidebar } from "./AppSidebar";
import { AppTopHeader } from "./AppTopHeader";

const SIDEBAR_COLLAPSED_KEY = "cp-sidebar-collapsed";

type WorkspaceChromeProps = {
  children: ReactNode;
};

export function WorkspaceChrome({ children }: WorkspaceChromeProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        setSidebarCollapsed(
          window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
        );
      } catch {
        /* ignore storage errors */
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(
          SIDEBAR_COLLAPSED_KEY,
          next ? "1" : "0",
        );
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  return (
    <AiNudgeProvider>
      <div className="relative flex h-dvh max-h-dvh overflow-hidden">
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppTopHeader />
          <AiNudgeToast />

          <AppFooterScrollRegion>{children}</AppFooterScrollRegion>
        </div>
      </div>
    </AiNudgeProvider>
  );
}
