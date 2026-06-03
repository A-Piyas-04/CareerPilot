"use client";

import { usePathname } from "next/navigation";

import { TransitionLink } from "@/components/navigation/navigation-transition";
import { SIDEBAR_NAV_GROUPS } from "@/lib/navigation-config";
import { isNavItemActive, NAV_ACCENT_STYLES } from "@/lib/nav-styles";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-[var(--cp-sidebar-width)] shrink-0 flex-col border-r border-[var(--cp-sidebar-border)] bg-[var(--cp-sidebar-bg)] shadow-[inset_-1px_0_0_rgba(0,0,0,0.15)] lg:flex"
      aria-label="Workspace navigation"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
        {SIDEBAR_NAV_GROUPS.map((group) => {
          const styles = NAV_ACCENT_STYLES[group.accent];
          return (
            <section
              key={group.label}
              className={`mb-3 last:mb-0 ${styles.sidebarSectionDark}`}
              aria-label={group.label}
            >
              <div className="px-2 pb-1 pt-1">
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider ${styles.sidebarPanelHeaderDark}`}
                >
                  {group.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                  {group.description}
                </p>
              </div>

              <ul className="mt-1 space-y-0.5 p-1.5">
                {group.items.map(({ href, label, icon: Icon, description }) => {
                  const isActive = isNavItemActive(pathname, href);
                  return (
                    <li key={href}>
                      <TransitionLink
                        href={href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
                          isActive
                            ? styles.itemActive
                            : styles.sidebarItemIdle
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                            isActive
                              ? styles.itemActiveIcon
                              : styles.sidebarIconIdle
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold leading-tight">
                            {label}
                          </span>
                          {description ? (
                            <span
                              className={`mt-0.5 block text-[11px] leading-snug ${
                                isActive ? "text-white/85" : "text-zinc-500"
                              }`}
                            >
                              {description}
                            </span>
                          ) : null}
                        </span>
                      </TransitionLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
