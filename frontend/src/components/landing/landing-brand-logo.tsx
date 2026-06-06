"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { scrollToLandingSection } from "@/components/landing/landing-section-nav";

type LandingBrandLogoProps = {
  compact?: boolean;
};

export function LandingBrandLogo({ compact = false }: LandingBrandLogoProps) {
  return (
    <Link
      className="group flex shrink-0 items-center gap-3 rounded-xl py-1.5 pr-2 transition hover:bg-zinc-100/90 dark:hover:bg-emerald-950/40"
      href="/#features"
      onClick={(event) => {
        if (window.location.pathname !== "/") return;
        event.preventDefault();
        scrollToLandingSection("#features");
      }}
    >
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 shadow-md shadow-emerald-900/20 ring-1 ring-emerald-800/25 transition duration-200 group-hover:shadow-lg group-hover:shadow-emerald-900/25 dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-900 dark:shadow-emerald-500/20 dark:ring-emerald-500/30 dark:group-hover:shadow-emerald-500/30">
        <Sparkles className="h-5 w-5 text-white" aria-hidden />
      </span>
      {!compact && (
        <span className="hidden min-w-0 sm:block">
          <span className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              CareerPilot
            </span>
            <span className="rounded-md bg-emerald-100/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-500/20">
              Platform
            </span>
          </span>
          <span className="mt-0.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Career intelligence workspace
          </span>
        </span>
      )}
      {compact && (
        <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          CareerPilot
        </span>
      )}
    </Link>
  );
}
