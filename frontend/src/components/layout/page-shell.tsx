"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { TransitionLink } from "@/components/navigation/navigation-transition";

import type { NavGroupAccent } from "@/lib/navigation-config";
import { getAccentForPath, getPageAccentStyles } from "@/lib/nav-styles";
import {
  eyebrow,
  pageContainer,
  pageContainerWide,
  pageDescription,
  pageShell,
  pageTitle,
  relatedLinkPill,
} from "@/lib/ui-theme";

type PageShellProps = {
  children: ReactNode;
  width?: "default" | "wide" | "full";
};

function PageBackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute -right-16 top-32 h-64 w-64 rounded-full bg-sky-300/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-violet-300/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #047857 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}

export function PageShell({ children, width = "default" }: PageShellProps) {
  const containerClass =
    width === "wide"
      ? pageContainerWide
      : width === "full"
        ? "relative mx-auto w-full max-w-[1560px] px-5 py-6"
        : pageContainer;

  return (
    <div className={pageShell}>
      <PageBackgroundDecor />
      <div className={containerClass}>{children}</div>
    </div>
  );
}

type PageHeaderProps = {
  icon?: LucideIcon;
  iconClassName?: string;
  title: string;
  description?: string;
  eyebrowText?: string;
  actions?: ReactNode;
  statusPills?: ReactNode;
  nextAction?: ReactNode;
  relatedLinks?: { href: string; label: string }[];
  children?: ReactNode;
  accent?: NavGroupAccent;
};

export function PageHeader({
  icon: Icon,
  iconClassName,
  title,
  description,
  eyebrowText,
  actions,
  statusPills,
  nextAction,
  relatedLinks,
  children,
  accent: accentProp,
}: PageHeaderProps) {
  const pathname = usePathname();
  const accent = accentProp ?? getAccentForPath(pathname);
  const styles = getPageAccentStyles(accent);

  return (
    <header className="mb-6 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/60 pb-5 shadow-sm ring-1 ring-zinc-950/[0.03] backdrop-blur-sm">
      <div className={`px-5 pt-5 ${styles.headerBand}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName ?? styles.iconTile}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="min-w-0">
              {eyebrowText ? (
                <p className={`${eyebrow} mb-1`}>{eyebrowText}</p>
              ) : null}
              <h1 className={pageTitle}>{title}</h1>
              {description ? (
                <p className={pageDescription}>{description}</p>
              ) : null}
              {statusPills ? (
                <div className="mt-2 flex flex-wrap gap-2">{statusPills}</div>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>

      <div className="px-5">
        {nextAction ? (
          <div className="mt-4 rounded-xl border border-zinc-200/80 bg-gradient-to-r from-white to-zinc-50/80 px-4 py-3 shadow-sm">
            {nextAction}
          </div>
        ) : null}

        {relatedLinks && relatedLinks.length > 0 ? (
          <nav
            aria-label="Related pages"
            className="mt-4 flex flex-wrap gap-2"
          >
            {relatedLinks.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                className={relatedLinkPill(accent)}
              >
                {link.label}
              </TransitionLink>
            ))}
          </nav>
        ) : null}

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </header>
  );
}
