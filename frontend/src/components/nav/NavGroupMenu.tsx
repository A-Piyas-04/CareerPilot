"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { TransitionLink } from "@/components/navigation/navigation-transition";

import type { NavGroup } from "@/lib/navigation-config";
import {
  isNavItemActive,
  NAV_ACCENT_STYLES,
} from "@/lib/nav-styles";

type NavGroupMenuProps = {
  group: NavGroup;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export function NavGroupMenu({
  group,
  pathname,
  isOpen,
  onToggle,
  onClose,
}: NavGroupMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const styles = NAV_ACCENT_STYLES[group.accent];
  const groupIsActive = group.items.some((item) =>
    isNavItemActive(pathname, item.href),
  );
  const activeItem = group.items.find((item) =>
    isNavItemActive(pathname, item.href),
  );

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={onToggle}
        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
          isOpen || groupIsActive
            ? styles.triggerActive
            : `text-zinc-600 ${styles.triggerHover}`
        }`}
      >
        <span>{group.label}</span>
        {activeItem && !isOpen ? (
          <span className="hidden max-w-[120px] truncate text-xs font-medium opacity-70 lg:inline">
            · {activeItem.label}
          </span>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute left-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-2xl border bg-white shadow-xl shadow-zinc-900/10 ${styles.panelBorder}`}
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className={`text-xs font-bold uppercase tracking-wider ${styles.panelHeader}`}>
              {group.label}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              {group.description}
            </p>
          </div>

          <ul className="space-y-1 p-2">
            {group.items.map(({ href, label, icon: Icon, description }) => {
              const isActive = isNavItemActive(pathname, href);
              return (
                <li key={href}>
                  <TransitionLink
                    href={href}
                    role="menuitem"
                    onClick={onClose}
                    className={`group flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-150 ${
                      isActive
                        ? styles.itemActive
                        : `text-zinc-800 ${styles.itemHover}`
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? styles.itemActiveIcon
                          : `${styles.iconBg} ${styles.iconText} group-hover:scale-105`
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{label}</span>
                      {description ? (
                        <span
                          className={`mt-0.5 block text-xs leading-5 ${
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
        </div>
      ) : null}
    </div>
  );
}
