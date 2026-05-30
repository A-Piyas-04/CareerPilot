"use client";

import { AlertTriangle, FileQuestion, LayoutDashboard, Kanban } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { btnPrimary, btnSecondary, premiumCard } from "@/lib/ui-theme";

type ErrorPageContentProps = {
  title: string;
  description: string;
  icon?: "error" | "notFound";
  reset?: () => void;
  showReset?: boolean;
};

export function ErrorPageContent({
  title,
  description,
  icon = "error",
  reset,
  showReset = false,
}: ErrorPageContentProps) {
  const Icon = icon === "notFound" ? FileQuestion : AlertTriangle;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50/30 via-[var(--cp-page-bg)] to-sky-50/20 px-5 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -right-16 top-32 h-64 w-64 rounded-full bg-sky-300/15 blur-3xl" />
      </div>
      <div className={`relative w-full max-w-lg p-8 text-center ${premiumCard}`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 text-white shadow-md">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {showReset && reset ? (
            <button type="button" onClick={reset} className={btnSecondary}>
              Try again
            </button>
          ) : null}
          <Link href="/dashboard" className={btnPrimary}>
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Go to Dashboard
          </Link>
          <Link href="/tracker" className={btnSecondary}>
            <Kanban className="h-4 w-4" aria-hidden />
            Back to Tracker
          </Link>
        </div>
      </div>
    </main>
  );
}

export function LoginBenefitsPanel({ children }: { children?: ReactNode }) {
  return (
    <div className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 text-white shadow-xl md:flex md:flex-col md:justify-center">
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
