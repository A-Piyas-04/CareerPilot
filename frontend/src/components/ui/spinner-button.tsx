"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import {
  btnDanger,
  btnGhost,
  btnPrimary,
  btnPrimarySky,
  btnSecondary,
} from "@/lib/ui-theme";

type SpinnerButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "emerald"
  | "sky";

const VARIANT_CLASSES: Record<SpinnerButtonVariant, string> = {
  primary: `${btnPrimary} disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:opacity-100`,
  secondary: `${btnSecondary} disabled:cursor-not-allowed disabled:opacity-55`,
  danger: `${btnDanger} disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:opacity-100`,
  ghost: `${btnGhost} disabled:cursor-not-allowed disabled:opacity-55`,
  emerald: `${btnPrimary} disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:opacity-100`,
  sky: `${btnPrimarySky} disabled:cursor-not-allowed disabled:opacity-60`,
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
