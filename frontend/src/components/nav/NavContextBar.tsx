"use client";

import Link from "next/link";

import { findActiveNavGroup, isNavItemActive, NAV_ACCENT_STYLES } from "@/lib/nav-styles";

type NavContextBarProps = {
  pathname: string;
};

export function NavContextBar({ pathname }: NavContextBarProps) {
  const group = findActiveNavGroup(pathname);
  if (!group || group.items.length < 2) {
    return null;
  }

  const styles = NAV_ACCENT_STYLES[group.accent];

  return (
    <div
      className={`hidden border-b bg-white/90 lg:block ${styles.panelBorder}`}
      aria-label={`${group.label} section`}
    >
      <div className="mx-auto flex max-w-[1560px] items-center gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span
          className={`hidden shrink-0 text-[11px] font-bold uppercase tracking-wider sm:inline ${styles.panelHeader}`}
        >
          {group.label}
        </span>
        <span className="hidden h-4 w-px shrink-0 bg-zinc-200 sm:block" />

        <div className="flex min-w-0 items-center gap-1.5">
          {group.items.map(({ href, label, icon: Icon, shortLabel }) => {
            const isActive = isNavItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? `${styles.itemActive} scale-[1.02]`
                    : `border border-transparent text-zinc-600 ${styles.itemHover}`
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel ?? label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
