import { Suspense } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { LoginForm } from "./login-form";
import { surfaceCard } from "@/lib/ui-theme";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--cp-page-bg)] px-5 py-6">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link className="flex items-center gap-2.5" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-zinc-900">CareerPilot</span>
        </Link>
        <Link
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          href="/"
        >
          Back to landing
        </Link>
      </header>
      <Suspense
        fallback={
          <section className={`mx-auto h-96 w-full max-w-md ${surfaceCard}`} />
        }
      >
        <div className="flex flex-1 items-center justify-center py-10">
          <LoginForm />
        </div>
      </Suspense>
    </main>
  );
}
