"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";

import { CoverLetterGenerateForm } from "@/components/cover-letters/CoverLetterGenerateForm";
import { CoverLetterList } from "@/components/cover-letters/CoverLetterList";
import { Card, PageHeader, SubmissionProgress } from "@/components/ui";
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
    <main className="cp-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Documents"
          icon={Mail}
          title="Cover Letter Studio"
          description="Generate, refine, copy, and revisit tailored letters grounded in your CV."
        />
      </div>
      <div className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
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

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Saved cover letters
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Review, copy, edit, or regenerate previous versions.
            </p>
          </div>
          <CoverLetterList
            coverLetters={coverLetters.data?.coverLetters ?? []}
            error={coverLetters.error?.message}
            isLoading={coverLetters.isLoading}
          />
        </Card>
      </div>
    </main>
  );
}
