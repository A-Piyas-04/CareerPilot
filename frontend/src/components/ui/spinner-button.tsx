"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SpinnerButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "emerald";

const VARIANT_CLASSES: Record<SpinnerButtonVariant, string> = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:opacity-55",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-subtle)] disabled:cursor-not-allowed disabled:opacity-55",
  danger:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--danger)] px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55",
  ghost:
    "inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-55",
  emerald:
    "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 dark:text-[#10120f]",
};

type SpinnerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  variant?: SpinnerButtonVariant;
  icon?: ReactNode;
  fullWidth?: boolean;
};

export function SpinnerButton({
  loading = false,
  loadingLabel,
  variant = "primary",
  icon,
  children,
  disabled,
  className,
  fullWidth,
  type = "button",
  ...props
}: SpinnerButtonProps) {
  const isDisabled = disabled || loading;
  const label = loading && loadingLabel ? loadingLabel : children;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        VARIANT_CLASSES[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : icon ? (
        <span className="shrink-0" aria-hidden>
          {icon}
        </span>
      ) : null}
      {label}
    </button>
  );
}
