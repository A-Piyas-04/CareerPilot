"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button, Input, SpinnerButton } from "@/components/ui";
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
  const nextPath = searchParams.get("next") ?? "/dashboard";

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
    <section className="w-[min(100%,28rem)] max-w-[calc(100vw-2.5rem)] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-glass)] p-6 shadow-[var(--shadow-strong)] backdrop-blur-2xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
          CareerPilot
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {mode === "signin"
            ? "Return to your career command center."
            : "Create your workspace and start organizing your job search."}
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <Field label="Full name">
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Amina Rahman"
            />
          </Field>
        ) : null}

        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </Field>

        {message ? (
          <p className="rounded-2xl border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">
            {message}
          </p>
        ) : null}

        <SpinnerButton
          type="submit"
          variant="emerald"
          fullWidth
          loading={isSubmitting}
          loadingLabel={mode === "signin" ? "Signing in..." : "Creating account..."}
          className="h-11"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </SpinnerButton>
      </form>

      <Button
        className="mt-4 w-full"
        variant="ghost"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage(null);
        }}
      >
        {mode === "signin"
          ? "Need an account? Create one"
          : "Already have an account? Sign in"}
      </Button>
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}
