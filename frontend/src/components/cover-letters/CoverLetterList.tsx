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
    return <div className={`p-4 ${alertError}`}>{error}</div>;
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
