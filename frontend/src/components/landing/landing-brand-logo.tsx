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
      className="group flex shrink-0 items-center gap-3 rounded-xl py-1.5 pr-2 transition hover:bg-zinc-100/90"
      href="/#features"
      onClick={(event) => {
        if (window.location.pathname !== "/") return;
        event.preventDefault();
        scrollToLandingSection("#features");
      }}
    >
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 shadow-md shadow-emerald-900/20 ring-1 ring-emerald-800/25 transition duration-200 group-hover:shadow-lg group-hover:shadow-emerald-900/25">
        <Sparkles className="h-5 w-5 text-white" aria-hidden />
      </span>
      {!compact && (
        <span className="hidden min-w-0 sm:block">
          <span className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-zinc-900">
              CareerPilot
            </span>
            <span className="rounded-md bg-emerald-100/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-emerald-800">
              Platform
            </span>
          </span>
          <span className="mt-0.5 block text-sm font-medium text-zinc-500">
            Career intelligence workspace
          </span>
        </span>
      )}
      {compact && (
        <span className="text-base font-semibold tracking-tight text-zinc-900">
          CareerPilot
        </span>
      )}
    </Link>
  );
}
