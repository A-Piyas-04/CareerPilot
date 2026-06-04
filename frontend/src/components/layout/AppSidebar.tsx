"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { TransitionLink } from "@/components/navigation/navigation-transition";
import { suppressExtensionHydrationProps } from "@/lib/hydration";
import { SIDEBAR_NAV_GROUPS } from "@/lib/navigation-config";
import { isNavItemActive, NAV_ACCENT_STYLES } from "@/lib/nav-styles";

type AppSidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="workspace-sidebar"
      data-collapsed={collapsed ? "true" : "false"}
      className="relative hidden h-dvh max-h-dvh shrink-0 flex-col overflow-visible border-r border-[var(--cp-sidebar-border)] bg-[var(--cp-sidebar-bg)] transition-[width] duration-300 ease-in-out will-change-[width] lg:flex"
      style={{
        width: collapsed
          ? "var(--cp-sidebar-width-collapsed)"
          : "var(--cp-sidebar-width)",
      }}
      aria-label="Workspace navigation"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pb-6 pt-[var(--cp-header-height)]">
        <nav className="flex flex-col" aria-label="Workspace sections">
          {SIDEBAR_NAV_GROUPS.map((group, groupIndex) => {
            const styles = NAV_ACCENT_STYLES[group.accent];
            return (
              <section
                key={group.label}
                className={
                  groupIndex > 0
                    ? collapsed
                      ? "mt-4 border-t border-slate-400/35 pt-4"
                      : "mt-5 border-t border-slate-400/40 pt-5"
                    : undefined
                }
                aria-label={group.label}
              >
                <ul className="space-y-0.5">
                  {group.items.map(
                    ({ href, label, shortLabel }) => {
                      const isActive = isNavItemActive(pathname, href);
                      const displayShort = shortLabel ?? label.slice(0, 3);
                      return (
                        <li key={href}>
                          <TransitionLink
                            href={href}
                            title={collapsed ? label : undefined}
                            aria-current={isActive ? "page" : undefined}
                            aria-label={collapsed ? label : undefined}
                            className={`block rounded-md transition-colors duration-150 ${
                              collapsed
                                ? "border-l-0 px-1.5 py-2 text-center text-sm"
                                : "px-2.5 py-2.5 text-[19px]"
                            } ${
                              isActive
                                ? collapsed
                                  ? "bg-white/[0.08] font-medium text-slate-100"
                                  : `${styles.sidebarItemActive} font-medium`
                                : `${styles.sidebarItemIdle} font-normal`
                            }`}
                          >
                            {collapsed ? (
                              <span className="block font-medium leading-tight">
                                {displayShort}
                              </span>
                            ) : (
                              <span className="block truncate leading-snug tracking-[0.01em]">
                                {label}
                              </span>
                            )}
                          </TransitionLink>
                        </li>
                      );
                    },
                  )}
                </ul>
              </section>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute top-[42%] right-0 z-50 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--cp-border)] bg-[var(--cp-surface)] text-[var(--cp-text-muted)] shadow-sm transition-colors duration-150 hover:border-[var(--cp-border-strong)] hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cp-workspace-main)]"
        aria-expanded={!collapsed}
        aria-controls="workspace-sidebar"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        {...suppressExtensionHydrationProps}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className="sr-only">
          {collapsed ? "Expand sidebar" : "Collapse sidebar"}
        </span>
      </button>
    </aside>
  );
}
