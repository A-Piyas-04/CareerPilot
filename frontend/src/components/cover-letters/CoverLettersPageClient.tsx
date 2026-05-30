"use client";

import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CoverLetterGenerateForm } from "@/components/cover-letters/CoverLetterGenerateForm";
import { CoverLetterList } from "@/components/cover-letters/CoverLetterList";
import { PageHeader, PageShell } from "@/components/layout";
import { SubmissionProgress } from "@/components/ui";
import { listMatches } from "@/features/jobs/api";
import { COVER_LETTER_GENERATE_STEPS } from "@/lib/progress/cover-letter-progress";
import {
  useCoverLetters,
  useGenerateCoverLetter,
} from "@/lib/hooks/useCoverLetters";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { surfaceCard } from "@/lib/ui-theme";
import type { GenerateCoverLetterRequest } from "@/lib/cover-letter/types";

export function CoverLettersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId");

  const coverLetters = useCoverLetters();
  const generateCoverLetter = useGenerateCoverLetter();
  const [prefill, setPrefill] = useState<{
    jobTitle: string;
    companyName: string;
    jobDescription: string;
    jobId: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    if (!jobIdParam) return;

    const jobId = jobIdParam;
    let cancelled = false;

    async function loadJobContext() {
      try {
        const matches = await listMatches({ job_id: jobId, limit: 1 });
        if (cancelled || !matches.length) return;

        const job = matches[0].job;
        const description = [job.description, job.requirements]
          .filter(Boolean)
          .join("\n\n")
          .trim();

        setPrefill({
          jobTitle: job.title,
          companyName: job.company ?? "",
          jobDescription: description,
          jobId: job.id,
          label: [job.title, job.company].filter(Boolean).join(" at "),
        });
      } catch {
        // Optional prefill only.
      }
    }

    void loadJobContext();
    return () => {
      cancelled = true;
    };
  }, [jobIdParam]);

  const handleGenerate = (payload: GenerateCoverLetterRequest) => {
    generateCoverLetter.mutate(payload, {
      onSuccess: (data) => {
        router.push(`/cover-letters/${data.coverLetter.id}`);
      },
    });
  };

  return (
    <PageShell>
      <PageHeader
        accent="sky"
        eyebrowText="Plan"
        icon={Mail}
        title="Cover Letters"
        description="Generate tailored letters from job descriptions and verified CV context."
        relatedLinks={PAGE_RELATED_LINKS["/cover-letters"]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <CoverLetterGenerateForm
            isGenerating={generateCoverLetter.isPending}
            onGenerate={handleGenerate}
            initialValues={
              prefill ?? (jobIdParam ? { jobId: jobIdParam } : undefined)
            }
            prefillLabel={prefill?.label}
          />
          <SubmissionProgress
            isActive={generateCoverLetter.isPending}
            mode="simulated"
            steps={[...COVER_LETTER_GENERATE_STEPS]}
            tone="sky"
          />
        </div>

        <section className={`p-5 ${surfaceCard}`}>
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
    </PageShell>
  );
}
