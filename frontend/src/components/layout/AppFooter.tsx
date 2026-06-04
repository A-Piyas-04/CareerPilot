"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const COPYRIGHT_YEAR = new Date().getFullYear();

/** Routes that use a fixed viewport panel (internal scroll only). */
function isImmersiveWorkspaceRoute(pathname: string) {
  return pathname === "/chat" || pathname.startsWith("/chat/");
}

export function AppFooter() {
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

/** Main page scroll area with footer appended after page content. */
export function AppFooterScrollRegion({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = isImmersiveWorkspaceRoute(pathname);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--cp-workspace-main)]">
      <div
        className={
          immersive
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
        }
      >
        {children}
      </div>
      <AppFooter />
    </div>
  );
}
