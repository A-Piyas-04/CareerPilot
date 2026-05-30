"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { TransitionLink } from "@/components/navigation/navigation-transition";
import { PageShell } from "@/components/layout/page-shell";

import { pageDescription, pageTitle, premiumCard } from "@/lib/ui-theme";

type DetailPageShellProps = {
  backHref: string;
  backLabel?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  meta?: ReactNode;
};

export function DetailPageShell({
  backHref,
  backLabel = "Back",
  title,
  description,
  actions,
  children,
  meta,
}: DetailPageShellProps) {
  return (
    <PageShell>
      <TransitionLink
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-emerald-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </TransitionLink>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className={pageTitle}>{title}</h1>
          {description ? <p className={pageDescription}>{description}</p> : null}
          {meta ? <div className="mt-2 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      <div className={`mt-6 ${premiumCard}`}>
        <div className="p-5 md:p-6">{children}</div>
      </div>
    </PageShell>
  );
}
