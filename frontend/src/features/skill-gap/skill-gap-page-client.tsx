"use client";

import { LineChart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader, PageShell } from "@/components/layout";
import { SubmissionProgress } from "@/components/ui";
import { listMatches } from "@/features/jobs/api";
import { useSavedJobMatches } from "@/features/jobs/hooks";
import {
  matchToSavedJobPrefill,
  type SavedJobPrefill,
} from "@/features/jobs/job-prefill";
import { useResumes } from "@/features/resume/hooks";
import { pickPrimaryResume } from "@/features/resume/types";
import {
  useAnalyzeSkillGap,
  useSkillGapAnalyses,
  useSkillGapDetail,
} from "@/lib/hooks/useSkillGap";
import { surfaceCard } from "@/lib/ui-theme";

import { SkillGapAnalyzeForm } from "./skill-gap-analyze-form";
import { SkillGapDetail } from "./skill-gap-detail";
import { SkillGapList } from "./skill-gap-list";

const ANALYZE_STEPS = [
  "Retrieving CV context",
  "Extracting role requirements",
  "Comparing skills and generating recommendations",
  "Saving analysis",
];

export function SkillGapPageClient() {
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get("jobId");

  const resumesQuery = useResumes();
  const resumes = useMemo(() => resumesQuery.data ?? [], [resumesQuery.data]);
  const primary = useMemo(() => pickPrimaryResume(resumes), [resumes]);
  const resumeId = useMemo(() => {
    const ready = resumes.find((resume) => resume.status === "processed");
    return ready?.id ?? primary?.id ?? null;
  }, [primary, resumes]);

  const analysesQuery = useSkillGapAnalyses();
  const analyze = useAnalyzeSkillGap();
  const savedJobsQuery = useSavedJobMatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<SavedJobPrefill | null>(null);

  const detailQuery = useSkillGapDetail(selectedId);

  useEffect(() => {
    if (!jobIdParam) return;

    const jobId = jobIdParam;
    let cancelled = false;

    async function loadJobContext() {
      try {
        const matches = await listMatches({ job_id: jobId, limit: 1 });
        if (cancelled || !matches.length) return;

        setPrefill(matchToSavedJobPrefill(matches[0]));
      } catch {
        // Prefill is optional; form remains usable without it.
      }
    }

    void loadJobContext();
    return () => {
      cancelled = true;
    };
  }, [jobIdParam]);

  function handleSelectSavedJob(match: Parameters<typeof matchToSavedJobPrefill>[0]) {
    setPrefill(matchToSavedJobPrefill(match));
  }

  function handleClearSavedJob() {
    setPrefill(null);
  }

  function handleAnalyze(values: {
    targetRole: string;
    jobDescription: string;
    jobId?: string | null;
    resumeId?: string | null;
  }) {
    analyze.mutate(
      {
        target_role: values.targetRole,
        job_description: values.jobDescription,
        job_id: values.jobId ?? prefill?.jobId ?? jobIdParam,
        resume_id: values.resumeId ?? resumeId,
      },
      {
        onSuccess: (data) => {
          setSelectedId(data.id);
        },
      },
    );
  }

  return (
    <PageShell>
      <PageHeader
        accent="sky"
        icon={LineChart}
        title="Skill Gap Analysis"
        description="Compare your CV against a target role and get prioritized learning recommendations."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <SkillGapAnalyzeForm
            initialValues={{
              targetRole: prefill?.targetRole,
              jobDescription: prefill?.jobDescription,
              jobId: prefill?.jobId ?? jobIdParam,
              resumeId,
            }}
            previewMissingSkills={prefill?.previewMissingSkills ?? []}
            prefillLabel={prefill?.label}
            savedJobs={savedJobsQuery.data ?? []}
            isLoadingSavedJobs={savedJobsQuery.isLoading}
            savedJobsError={savedJobsQuery.error?.message}
            onSelectSavedJob={handleSelectSavedJob}
            onClearSavedJob={handleClearSavedJob}
            isAnalyzing={analyze.isPending}
            onAnalyze={handleAnalyze}
          />
          <SubmissionProgress
            isActive={analyze.isPending}
            mode="simulated"
            steps={ANALYZE_STEPS}
            tone="sky"
          />
        </div>

        <section className="space-y-4">
          <div className={`p-5 ${surfaceCard}`}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-zinc-950">
                Saved analyses
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Revisit prior gap checks and jump into a learning roadmap.
              </p>
            </div>
            <SkillGapList
              analyses={analysesQuery.data ?? []}
              selectedId={selectedId}
              isLoading={analysesQuery.isLoading}
              error={analysesQuery.error?.message}
              onSelect={setSelectedId}
            />
          </div>

          <div className={`p-5 ${surfaceCard}`}>
            <h2 className="text-base font-semibold text-zinc-950">Analysis detail</h2>
            <div className="mt-4">
              <SkillGapDetail
                analysis={detailQuery.data}
                isLoading={Boolean(selectedId) && detailQuery.isLoading}
                error={detailQuery.error?.message}
              />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
