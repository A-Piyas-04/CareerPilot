"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { suppressExtensionHydrationProps } from "@/lib/hydration";

import { useTheme } from "./ThemeProvider";

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const isDark = mounted && theme === "dark";

  return (
    <button
      {...suppressExtensionHydrationProps}
      suppressHydrationWarning
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] text-[var(--cp-text-secondary)] shadow-sm transition hover:border-[var(--cp-border-strong)] hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cp-header-bg)]"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
