import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClassName } from "@/components/ui";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link className="flex items-center gap-3" href="/">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)]">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(84,214,182,0.45),transparent_42%),radial-gradient(circle_at_76%_82%,rgba(138,163,255,0.5),transparent_44%)]" />
            <Sparkles className="relative h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">CareerPilot</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <Link
            className={buttonClassName({ size: "sm", variant: "secondary" })}
            href="/"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl gap-10 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Welcome back
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight tracking-tight">
            Keep your career search moving with one focused workspace.
          </h1>
          <div className="mt-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-strong)] backdrop-blur-2xl">
            <div className="grid gap-3">
              {[
                ["CV Intelligence", "Parsed and ready"],
                ["Tracker", "5 active applications"],
                ["Calendar", "2 upcoming deadlines"],
              ].map(([title, detail]) => (
                <div
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4"
                  key={title}
                >
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <section className="h-96 w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-glass)] shadow-[var(--shadow-soft)]" />
          }
        >
          <div className="flex w-full items-center justify-center lg:justify-end">
            <LoginForm />
          </div>
        </Suspense>
      </section>
    </main>
  );
}
