"use client";

import { Laptop, Moon, Sun } from "lucide-react";

import { cn } from "@/components/ui/cn";

import { useTheme } from "./theme-provider";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-soft)]",
        compact ? "gap-0.5" : "gap-1",
      )}
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;

        return (
          <button
            key={value}
            className={cn(
              "inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-[var(--muted-foreground)] transition duration-200 hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              active &&
                "bg-[var(--foreground)] text-[var(--background)] shadow-sm hover:text-[var(--background)]",
              compact && "w-8 px-0",
            )}
            type="button"
            onClick={() => setTheme(value)}
            title={label}
            aria-pressed={active}
          >
            <Icon className="h-4 w-4" />
            {compact ? <span className="sr-only">{label}</span> : label}
          </button>
        );
      })}
    </div>
  );
}
