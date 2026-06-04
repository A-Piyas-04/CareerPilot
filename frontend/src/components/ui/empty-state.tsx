import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { NavGroupAccent } from "@/lib/navigation-config";
import { getPageAccentStyles } from "@/lib/nav-styles";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  accent?: NavGroupAccent;
  variant?: "dashed" | "filled";
  prompts?: { label: string; onClick?: () => void; href?: string }[];
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  accent = "emerald",
  variant = "dashed",
  prompts,
  className,
}: EmptyStateProps) {
  const styles = getPageAccentStyles(accent);
  const base =
    variant === "dashed"
      ? `flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center ${styles.emptyStateBg}`
      : `flex flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center shadow-sm ${styles.emptyStateBg}`;

  return (
    <div className={[base, className].filter(Boolean).join(" ")}>
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${styles.iconTile}`}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-[var(--cp-text-primary)]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[var(--cp-text-muted)]">{description}</p>
      ) : null}
      {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div> : null}
      {prompts && prompts.length > 0 ? (
        <div className="mt-5 grid w-full max-w-md gap-2 sm:grid-cols-2">
          {prompts.map((prompt) => {
            const inner = (
              <span className="block rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2.5 text-left text-xs font-medium text-[var(--cp-text-secondary)] transition hover:border-[var(--cp-border-strong)] hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)] hover:shadow-sm">
                {prompt.label}
              </span>
            );
            if (prompt.href) {
              return (
                <a key={prompt.label} href={prompt.href} className="block">
                  {inner}
                </a>
              );
            }
            if (prompt.onClick) {
              return (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={prompt.onClick}
                  className="block w-full text-left"
                >
                  {inner}
                </button>
              );
            }
            return <div key={prompt.label}>{inner}</div>;
          })}
        </div>
      ) : null}
    </div>
  );
}
