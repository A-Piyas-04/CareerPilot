import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  pageContainer,
  pageContainerWide,
  pageDescription,
  pageShell,
  pageTitle,
} from "@/lib/ui-theme";

type PageShellProps = {
  children: ReactNode;
  width?: "default" | "wide" | "full";
};

export function PageShell({ children, width = "default" }: PageShellProps) {
  const containerClass =
    width === "wide"
      ? pageContainerWide
      : width === "full"
        ? "mx-auto w-full max-w-[1560px] px-5 py-6"
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
  actions?: ReactNode;
  relatedLinks?: { href: string; label: string }[];
  children?: ReactNode;
  accent?: "emerald" | "sky";
};

export function PageHeader({
  icon: Icon,
  iconClassName,
  title,
  description,
  actions,
  relatedLinks,
  children,
  accent = "emerald",
}: PageHeaderProps) {
  const iconBg =
    accent === "sky"
      ? "bg-sky-600 shadow-sky-100"
      : "bg-emerald-700 shadow-emerald-100";

  return (
    <header className="mb-6 border-b border-zinc-200/80 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${iconClassName ?? iconBg}`}
            >
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className={pageTitle}>{title}</h1>
            {description ? <p className={pageDescription}>{description}</p> : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {relatedLinks && relatedLinks.length > 0 ? (
        <nav
          aria-label="Related pages"
          className="mt-4 flex flex-wrap gap-2"
        >
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
