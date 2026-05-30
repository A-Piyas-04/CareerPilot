"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import type { NavGroup } from "@/lib/navigation-config";
import { NAV_GROUPS } from "@/lib/navigation-config";
import {
  isNavItemActive,
  NAV_ACCENT_STYLES,
} from "@/lib/nav-styles";

type MobileNavDrawerProps = {
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
  onSignOut: () => void;
};

export function MobileNavDrawer({
  isOpen,
  pathname,
  onClose,
  onSignOut,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation menu"
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 right-0 flex w-[min(100vw-3rem,360px)] flex-col border-l border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-zinc-900">Navigation</p>
            <p className="text-xs text-zinc-500">Jump to any workspace</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {NAV_GROUPS.map((group) => (
            <MobileNavSection
              key={group.label}
              group={group}
              pathname={pathname}
              onNavigate={onClose}
            />
          ))}
        </div>

        <div className="border-t border-zinc-100 p-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

function MobileNavSection({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  const styles = NAV_ACCENT_STYLES[group.accent];

  return (
    <section
      className={`mb-3 overflow-hidden rounded-2xl border ${styles.mobileSection}`}
    >
      <div className="px-3 pb-1 pt-3">
        <p className={`text-xs font-bold uppercase tracking-wider ${styles.panelHeader}`}>
          {group.label}
        </p>
        <p className="text-[11px] text-zinc-500">{group.description}</p>
      </div>

      <ul className="space-y-1 p-2">
        {group.items.map(({ href, label, icon: Icon, description }) => {
          const isActive = isNavItemActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  isActive
                    ? styles.itemActive
                    : `bg-white/80 text-zinc-800 ${styles.itemHover}`
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isActive
                      ? styles.itemActiveIcon
                      : `${styles.iconBg} ${styles.iconText}`
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  {description ? (
                    <span
                      className={`block text-xs ${
                        isActive ? "text-white/85" : "text-zinc-500"
                      }`}
                    >
                      {description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MobileNavTrigger({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 lg:hidden"
      aria-label="Open navigation menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
