"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const COPYRIGHT_YEAR = new Date().getFullYear();

type AppFooterProps = {
  compact?: boolean;
};

export function AppFooter({ compact = false }: AppFooterProps) {
  if (compact) {
    return (
      <footer
        className="shrink-0 border-t border-[var(--cp-footer-border)] bg-[var(--cp-footer-bg)] px-4 py-3 text-center sm:px-6"
        aria-label="Site footer"
      >
        <div className="mx-auto flex w-full max-w-[1560px] flex-col items-center justify-center gap-1 text-white/90 sm:flex-row sm:gap-3">
          <p className="text-xs font-semibold">CareerPilot</p>
          <p
            className="text-[11px] text-white/70"
            suppressHydrationWarning
          >
            © {COPYRIGHT_YEAR} CareerPilot · Your data stays in your account
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="shrink-0 border-t border-[var(--cp-footer-border)] bg-[var(--cp-footer-bg)] px-4 py-6 text-center sm:px-6"
      aria-label="Site footer"
    >
      <div className="mx-auto w-full max-w-[1560px] text-white/95">
        <p className="text-sm font-semibold">CareerPilot</p>
        <p className="mt-1 text-xs text-white/80">
          AI-powered career co-pilot — track applications, grow skills, and land
          your next role.
        </p>
        <p
          className="mt-4 border-t border-white/15 pt-4 text-[11px] text-white/70"
          suppressHydrationWarning
        >
          © {COPYRIGHT_YEAR} CareerPilot · Your data stays in your account
        </p>
      </div>
    </footer>
  );
}

/** Main page scroll area with footer appended after page content. */
export function AppFooterScrollRegion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname === "/chat";

  if (isChatPage) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--cp-page-bg)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        <AppFooter compact />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[var(--cp-page-bg)]">
      {children}
      <AppFooter />
    </div>
  );
}
