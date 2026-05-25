import { Suspense } from "react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <Suspense
        fallback={
          <section className="h-96 w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-sm" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
