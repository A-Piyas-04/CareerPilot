"use client";

import { ErrorPageContent } from "@/components/layout/error-page-content";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPageContent
      title="Something went wrong"
      description="We hit an unexpected error. Your data is safe — try again or head back to your workspace."
      showReset
      reset={reset}
    />
  );
}
