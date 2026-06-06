"use client";

import { Map } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader, PageShell } from "@/components/layout";
import { RoadmapGenerateForm } from "@/components/roadmap/RoadmapGenerateForm";
import { RoadmapList } from "@/components/roadmap/RoadmapList";
import { SubmissionProgress } from "@/components/ui";
import { listMatches } from "@/features/jobs/api";
import { useSavedJobMatches } from "@/features/jobs/hooks";
import {
  matchToSavedJobPrefill,
  type SavedJobPrefill,
} from "@/features/jobs/job-prefill";
import { ROADMAP_GENERATE_STEPS } from "@/lib/progress/roadmap-progress";
import { useGenerateRoadmap, useRoadmaps } from "@/lib/hooks/useRoadmaps";
import { surfaceCard } from "@/lib/ui-theme";
import type { GenerateRoadmapRequest } from "@/lib/roadmap/types";

function prefillFromSearchParams(
  targetRole: string | null,
  jobDescription: string | null,
  company: string | null,
  jobId: string | null,
): SavedJobPrefill | null {
  if (!targetRole) {
    return null;
  }

  return {
    targetRole,
    jobDescription: jobDescription ?? "",
    jobId: jobId ?? "",
    label: company ? `${targetRole} at ${company}` : targetRole,
    previewMissingSkills: [],
  };
}

export function RoadmapPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRoleParam = searchParams.get("targetRole");
  const jobDescriptionParam = searchParams.get("jobDescription");
  const companyParam = searchParams.get("company");
  const jobIdParam = searchParams.get("jobId");

  const roadmaps = useRoadmaps();
  const generateRoadmap = useGenerateRoadmap();
  const savedJobsQuery = useSavedJobMatches();
  const [prefill, setPrefill] = useState<SavedJobPrefill | null>(() =>
    prefillFromSearchParams(
      targetRoleParam,
      jobDescriptionParam,
      companyParam,
      jobIdParam,
    ),
  );

  useEffect(() => {
    if (!jobIdParam) {
      return;
    }

    const jobId = jobIdParam;
    let cancelled = false;

    async function loadJobContext() {
      try {
        const matches = await listMatches({ job_id: jobId, limit: 1 });
        if (cancelled || !matches.length) {
          return;
        }

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

  const handleGenerate = (payload: GenerateRoadmapRequest) => {
    generateRoadmap.mutate(payload, {
      onSuccess: (data) => {
        router.push(`/roadmap/${data.roadmapId}`);
      },
    });
  };

  return (
    <PageShell>
      <PageHeader
        accent="sky"
        icon={Map}
        title="Learning Roadmap"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <RoadmapGenerateForm
            isGenerating={generateRoadmap.isPending}
            onGenerate={handleGenerate}
            initialValues={{
              targetRole: prefill?.targetRole,
              jobDescription: prefill?.jobDescription,
              jobId: prefill?.jobId ?? jobIdParam,
            }}
            prefillLabel={prefill?.label}
            savedJobs={savedJobsQuery.data ?? []}
            isLoadingSavedJobs={savedJobsQuery.isLoading}
            savedJobsError={savedJobsQuery.error?.message}
            onSelectSavedJob={(match) =>
              setPrefill(matchToSavedJobPrefill(match))
            }
            onClearSavedJob={() => setPrefill(null)}
          />
          <SubmissionProgress
            isActive={generateRoadmap.isPending}
            mode="simulated"
            steps={[...ROADMAP_GENERATE_STEPS]}
            tone="sky"
          />
        </div>

        <section className={`p-5 ${surfaceCard}`}>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-950">
              Saved roadmaps
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Open any roadmap to track progress and schedule work.
            </p>
          </div>
          <RoadmapList
            error={roadmaps.error?.message}
            isLoading={roadmaps.isLoading}
            roadmaps={roadmaps.data?.roadmaps ?? []}
          />
        </section>
      </div>
    </PageShell>
  );
}
