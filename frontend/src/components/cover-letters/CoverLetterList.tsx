"use client";

import { Mail } from "lucide-react";

import { CoverLetterCard } from "@/components/cover-letters/CoverLetterCard";
import type { CoverLetter } from "@/lib/cover-letter/types";

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
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-lg border border-zinc-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (coverLetters.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#1A56DB]">
          <Mail className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-zinc-950">
          No cover letters yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-600">
          Generate your first tailored letter from a job description.
        </p>
      </div>
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
