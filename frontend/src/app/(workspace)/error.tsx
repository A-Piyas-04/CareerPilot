"use client";

import { ErrorPageContent } from "@/components/layout/error-page-content";

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPageContent
      title="Something went wrong"
      description="This page failed to load. Try again or return to your dashboard."
      showReset
      reset={reset}
    />
  );
}
