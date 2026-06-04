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
  surfaceCardElevated,
} from "@/lib/ui-theme";

type PageShellProps = {
  children: ReactNode;
  width?: "default" | "wide" | "full";
};

export function PageShell({
  children,
  width = "default",
}: PageShellProps) {
  const containerClass =
    width === "wide"
      ? pageContainerWide
      : width === "full"
        ? "relative mx-auto w-full max-w-[1560px] px-5 py-6"
        : pageContainer;

  return (
    <div className={pageShell}>
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
  const hasBottomSection = Boolean(
    nextAction || (relatedLinks && relatedLinks.length > 0) || children,
  );

  return (
    <header
      className={`mb-6 overflow-hidden ${hasBottomSection ? "pb-5" : ""} ${surfaceCardElevated}`}
    >
      <div
        className={`px-5 pt-5 ${!hasBottomSection ? "pb-5" : ""} ${styles.headerBand}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconClassName ?? styles.iconTile}`}
              >
                <Icon className="h-6 w-6" />
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

      {hasBottomSection ? (
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
      ) : null}
    </header>
  );
}
