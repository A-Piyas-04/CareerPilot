"use client";

import type { ReactNode } from "react";

import { AppFooter } from "./AppFooter";
import { AppSidebar } from "./AppSidebar";
import { AppTopHeader } from "./AppTopHeader";

type WorkspaceChromeProps = {
  children: ReactNode;
};

export function WorkspaceChrome({ children }: WorkspaceChromeProps) {
  return (
    <div className="flex min-h-[calc(100vh-var(--cp-header-height))] lg:min-h-screen">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopHeader />

        <div className="flex min-h-0 flex-1 flex-col bg-[var(--cp-page-bg)]">
          {children}
        </div>

        <AppFooter />
      </div>
    </div>
  );
}
