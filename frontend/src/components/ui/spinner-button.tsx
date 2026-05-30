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
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-55",
  danger:
    "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300",
  ghost:
    "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-55",
  emerald:
    "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400",
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
