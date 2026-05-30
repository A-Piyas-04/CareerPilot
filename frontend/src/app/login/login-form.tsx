"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { SpinnerButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = searchParams.get("next") ?? "/tracker";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(nextPath);
      }
    });
  }, [nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName || email.split("@")[0],
                },
              },
            });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm the account, then sign in.");
        setMode("signin");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          CareerPilot
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Full name
            </span>
            <input
              className="mt-1 h-11 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Amina Rahman"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </label>

        {message ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}

        <SpinnerButton
          type="submit"
          variant="emerald"
          fullWidth
          loading={isSubmitting}
          loadingLabel={mode === "signin" ? "Signing in…" : "Creating account…"}
          className="h-11"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </SpinnerButton>
      </form>

      <button
        className="mt-4 w-full text-center text-sm font-medium text-emerald-800 hover:text-emerald-900"
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage(null);
        }}
      >
        {mode === "signin"
          ? "Need an account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </section>
  );
}
