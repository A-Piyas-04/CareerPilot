"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { TransitionLink } from "@/components/navigation/navigation-transition";
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
      className="relative hidden h-dvh max-h-dvh shrink-0 flex-col overflow-visible border-r border-[var(--cp-sidebar-border)] bg-[var(--cp-sidebar-bg)] shadow-[inset_-1px_0_0_rgba(0,0,0,0.15)] transition-[width] duration-300 ease-in-out will-change-[width] lg:flex"
      style={{
        width: collapsed
          ? "var(--cp-sidebar-width-collapsed)"
          : "var(--cp-sidebar-width)",
      }}
      aria-label="Workspace navigation"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-2 py-4">
        <div
          className={`flex flex-col ${collapsed ? "gap-3" : "gap-7"}`}
        >
          {SIDEBAR_NAV_GROUPS.map((group) => {
            const styles = NAV_ACCENT_STYLES[group.accent];
            return (
              <section
                key={group.label}
                className={`${styles.sidebarSectionDark} ${collapsed ? "p-1" : "p-1.5"}`}
                aria-label={group.label}
              >
                <ul className="space-y-0.5">
                  {group.items.map(
                    ({ href, label, shortLabel, description }) => {
                      const isActive = isNavItemActive(pathname, href);
                      const displayShort = shortLabel ?? label.slice(0, 3);
                      return (
                        <li key={href}>
                          <TransitionLink
                            href={href}
                            title={collapsed ? label : undefined}
                            aria-current={isActive ? "page" : undefined}
                            aria-label={collapsed ? label : undefined}
                            className={`block rounded-lg text-sm transition-colors duration-200 ${
                              collapsed
                                ? "px-1.5 py-2 text-center"
                                : "px-3 py-2.5"
                            } ${
                              isActive
                                ? styles.itemActive
                                : styles.sidebarItemIdle
                            }`}
                          >
                            {collapsed ? (
                              <span className="block text-xs font-semibold leading-tight transition-opacity duration-300">
                                {displayShort}
                              </span>
                            ) : (
                              <span className="min-w-0 transition-opacity duration-300">
                                <span className="block truncate font-semibold leading-tight">
                                  {label}
                                </span>
                                {description ? (
                                  <span
                                    className={`mt-0.5 block text-[11px] leading-snug transition-opacity duration-300 ${
                                      isActive
                                        ? "text-white/85"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {description}
                                  </span>
                                ) : null}
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
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        className="absolute top-[42%] right-0 z-50 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-700 shadow-[0_2px_12px_rgba(15,23,42,0.18)] transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        aria-expanded={!collapsed}
        aria-controls="workspace-sidebar"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
