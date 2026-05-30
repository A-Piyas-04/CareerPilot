import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";

import { LoginBenefitsPanel } from "@/components/layout/error-page-content";
import { Skeleton } from "@/components/ui";

import { LoginForm } from "./login-form";
import { btnSecondary, forestGradient } from "@/lib/ui-theme";

const BENEFITS = [
  "Search jobs and score fit against your CV",
  "Generate cover letters and learning roadmaps",
  "Track applications on a Kanban board",
  "Get AI nudges and skill gap insights",
] as const;

function LoginFormSkeleton() {
  return (
    <section className="w-full max-w-md space-y-4 rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-lg ring-1 ring-zinc-950/[0.03]">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col bg-gradient-to-b from-emerald-50/30 via-[var(--cp-page-bg)] to-sky-50/20 px-5 py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -right-16 top-32 h-64 w-64 rounded-full bg-sky-300/15 blur-3xl" />
      </div>

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link className="flex items-center gap-2.5" href="/">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md ${forestGradient}`}>
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-zinc-900">CareerPilot</span>
        </Link>
        <Link className={btnSecondary} href="/">
          Back to landing
        </Link>
      </header>

      <Suspense fallback={
        <div className="relative mx-auto mt-10 grid w-full max-w-5xl flex-1 gap-8 md:grid-cols-2 md:items-center">
          <LoginBenefitsPanel>
            <Skeleton className="h-6 w-32 bg-white/20" shimmer={false} />
          </LoginBenefitsPanel>
          <LoginFormSkeleton />
        </div>
      }>
        <div className="relative mx-auto mt-10 grid w-full max-w-5xl flex-1 gap-8 md:grid-cols-2 md:items-center">
          <LoginBenefitsPanel>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/90">
              Career workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Your AI-powered job search command center
            </h1>
            <p className="mt-3 text-sm leading-7 text-emerald-100/90">
              Sign in to search roles, polish applications, and track every step of your pipeline.
            </p>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-emerald-50/95">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>
          </LoginBenefitsPanel>
          <div className="flex items-center justify-center">
            <LoginForm />
          </div>
        </div>
      </Suspense>
    </main>
  );
}
