"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const COPYRIGHT_YEAR = new Date().getFullYear();

type AppFooterProps = {
  compact?: boolean;
};

/** Routes that use a fixed viewport panel (internal scroll only). */
function isImmersiveWorkspaceRoute(pathname: string) {
  return pathname === "/chat" || pathname.startsWith("/chat/");
}

export function AppFooter({ compact = false }: AppFooterProps) {
  if (compact) {
    return (
      <footer
        className="shrink-0 border-t border-[var(--cp-footer-border)] bg-[var(--cp-footer-bg)] px-4 py-2.5 text-center sm:px-6"
        aria-label="Site footer"
      >
        <div className="mx-auto flex w-full max-w-[1560px] flex-col items-center justify-center gap-1 text-white/90 sm:flex-row sm:gap-3">
          <p className="text-xs font-semibold tracking-tight">CareerPilot</p>
          <p
            className="text-[11px] text-white/65"
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
      className="shrink-0 border-t border-[var(--cp-footer-border)] bg-[var(--cp-footer-bg)] px-4 py-4 text-center sm:px-6"
      aria-label="Site footer"
    >
      <div className="mx-auto w-full max-w-[1560px] text-white/95">
        <p className="text-sm font-semibold tracking-tight">CareerPilot</p>
        <p className="mt-1 text-xs leading-relaxed text-white/75">
          AI-powered career co-pilot — track applications, grow skills, and land
          your next role.
        </p>
        <p
          className="mt-3 text-[11px] text-white/60"
          suppressHydrationWarning
        >
          © {COPYRIGHT_YEAR} CareerPilot · Your data stays in your account
        </p>
      </div>
    </footer>
  );
}

/** Main page scroll area; footer sits after content (scroll to reveal). */
export function AppFooterScrollRegion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = isImmersiveWorkspaceRoute(pathname);

  return (
    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[var(--cp-workspace-main)]">
      {immersive ? (
        <div className="flex min-h-[calc(100dvh-var(--cp-header-height))] flex-col overflow-hidden">
          {children}
        </div>
      ) : (
        children
      )}
      <AppFooter compact={immersive} />
    </div>
  );
}
