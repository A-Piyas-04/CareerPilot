"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { SpinnerButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  alertWarning,
  inputField,
  premiumCard,
} from "@/lib/ui-theme";

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
    <section className={`w-full max-w-md p-6 md:p-8 ${premiumCard}`}>
      <div className="mb-6">
        <div className="inline-flex rounded-full bg-zinc-100 p-1 ring-1 ring-zinc-200/80">
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              mode === "signin"
                ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/60"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => {
              setMode("signin");
              setMessage(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              mode === "signup"
                ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/60"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => {
              setMode("signup");
              setMessage(null);
            }}
          >
            Create account
          </button>
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-950">
          {mode === "signin" ? "Welcome back" : "Get started free"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {mode === "signin"
            ? "Sign in to continue your job search."
            : "Create an account to unlock all modules."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Full name</span>
            <input
              className={`mt-1.5 ${inputField} h-11`}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Amina Rahman"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Email</span>
          <input
            className={`mt-1.5 ${inputField} h-11`}
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
            className={`mt-1.5 ${inputField} h-11`}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </label>

        {message ? <p className={alertWarning}>{message}</p> : null}

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
    </section>
  );
}
