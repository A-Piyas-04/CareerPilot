import { Suspense } from "react";
import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7f9] px-5 py-6">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link className="text-sm font-semibold text-emerald-800" href="/">
          CareerPilot
        </Link>
        <Link
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          href="/"
        >
          Back to landing
        </Link>
      </header>
      <Suspense
        fallback={
          <section className="h-96 w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-sm" />
        }
      >
        <div className="flex flex-1 items-center justify-center py-10">
          <LoginForm />
        </div>
      </Suspense>
    </main>
  );
}
