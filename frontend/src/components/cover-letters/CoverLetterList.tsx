"use client";

import { Mail } from "lucide-react";

import { CoverLetterCard } from "@/components/cover-letters/CoverLetterCard";
import { EmptyState, ListCardSkeleton } from "@/components/ui";
import type { CoverLetter } from "@/lib/cover-letter/types";
import { alertError } from "@/lib/ui-theme";

type CoverLetterListProps = {
  coverLetters: CoverLetter[];
  error?: string;
  isLoading: boolean;
};

export function CoverLetterList({
  coverLetters,
  error,
  isLoading,
}: CoverLetterListProps) {
  if (isLoading) {
    return <ListCardSkeleton count={3} />;
  }

  if (error) {
    const needsDbGrants = /sql editor|apply-remote-grants/i.test(error);

    return (
      <div className={`space-y-3 p-4 ${alertError}`}>
        <p>{error}</p>
        {needsDbGrants ? (
          <a
            className="inline-block text-sm font-medium text-red-900 underline underline-offset-2"
            href="https://supabase.com/dashboard/project/hiqdwrjoqfpelrhujtoj/sql/new"
            rel="noreferrer"
            target="_blank"
          >
            Open Supabase SQL Editor →
          </a>
        ) : null}
      </div>
    );
  }

  if (coverLetters.length === 0) {
    return (
      <EmptyState
        accent="sky"
        className="min-h-64"
        description="Generate your first tailored letter from a job description."
        icon={Mail}
        title="No cover letters yet"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {coverLetters.map((coverLetter) => (
        <CoverLetterCard key={coverLetter.id} coverLetter={coverLetter} />
      ))}
    </div>
  );
}
