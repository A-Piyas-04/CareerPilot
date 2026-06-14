"use client";

import Link from "next/link";

import { btnPrimary } from "@/lib/ui-theme";

type Props = {
  reason: string | null;
};

export function EvidenceMapEmptyState({ reason }: Props) {
  const isNoResume = reason === "no_processed_resume";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--cp-border)] bg-[var(--cp-surface)] px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-zinc-950">
        {isNoResume ? "Upload your CV first" : "No requirements detected"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        {isNoResume
          ? "Evidence Map needs a processed resume to retrieve grounded CV excerpts for each job requirement."
          : "We could not extract requirements from this job description. Try a manual job paste with a fuller posting."}
      </p>
      {isNoResume ? (
        <Link href="/resume" className={`${btnPrimary} mt-6`}>
          Go to Resume
        </Link>
      ) : (
        <Link href="/jobs" className={`${btnPrimary} mt-6`}>
          Back to Jobs
        </Link>
      )}
    </div>
  );
}
