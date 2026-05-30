"use client";

import { useRouter } from "next/navigation";

import { CoverLetterGenerateForm } from "@/components/cover-letters/CoverLetterGenerateForm";
import { CoverLetterList } from "@/components/cover-letters/CoverLetterList";
import { SubmissionProgress } from "@/components/ui";
import { COVER_LETTER_GENERATE_STEPS } from "@/lib/progress/cover-letter-progress";
import {
  useCoverLetters,
  useGenerateCoverLetter,
} from "@/lib/hooks/useCoverLetters";
import type { GenerateCoverLetterRequest } from "@/lib/cover-letter/types";

export function CoverLettersPageClient() {
  const router = useRouter();
  const coverLetters = useCoverLetters();
  const generateCoverLetter = useGenerateCoverLetter();

  const handleGenerate = (payload: GenerateCoverLetterRequest) => {
    generateCoverLetter.mutate(payload, {
      onSuccess: (data) => {
        router.push(`/cover-letters/${data.coverLetter.id}`);
      },
    });
  };

  return (
    <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <CoverLetterGenerateForm
            isGenerating={generateCoverLetter.isPending}
            onGenerate={handleGenerate}
          />
          <SubmissionProgress
            isActive={generateCoverLetter.isPending}
            mode="simulated"
            steps={[...COVER_LETTER_GENERATE_STEPS]}
            tone="blue"
          />
        </div>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-950">
              Saved cover letters
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Review, copy, edit, or regenerate previous versions.
            </p>
          </div>
          <CoverLetterList
            coverLetters={coverLetters.data?.coverLetters ?? []}
            error={coverLetters.error?.message}
            isLoading={coverLetters.isLoading}
          />
        </section>
      </div>
    </main>
  );
}
