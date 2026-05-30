"use client";

import { Map } from "lucide-react";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader, PageShell } from "@/components/layout";
import { RoadmapGenerateForm } from "@/components/roadmap/RoadmapGenerateForm";
import { RoadmapList } from "@/components/roadmap/RoadmapList";
import { SubmissionProgress } from "@/components/ui";
import { ROADMAP_GENERATE_STEPS } from "@/lib/progress/roadmap-progress";
import { useGenerateRoadmap, useRoadmaps } from "@/lib/hooks/useRoadmaps";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { surfaceCard } from "@/lib/ui-theme";
import type { GenerateRoadmapRequest } from "@/lib/roadmap/types";

export function RoadmapPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRoleParam = searchParams.get("targetRole");
  const jobDescriptionParam = searchParams.get("jobDescription");
  const companyParam = searchParams.get("company");

  const roadmaps = useRoadmaps();
  const generateRoadmap = useGenerateRoadmap();

  const prefillLabel = useMemo(() => {
    if (!targetRoleParam) return null;
    return companyParam
      ? `${targetRoleParam} at ${companyParam}`
      : targetRoleParam;
  }, [companyParam, targetRoleParam]);

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
        icon={Map}
        title="Learning Roadmap"
        description="Generate weekly learning plans from skill gaps or target roles, then track progress over time."
        relatedLinks={PAGE_RELATED_LINKS["/roadmap"]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <RoadmapGenerateForm
            isGenerating={generateRoadmap.isPending}
            onGenerate={handleGenerate}
            initialValues={{
              targetRole: targetRoleParam ?? undefined,
              jobDescription: jobDescriptionParam ?? undefined,
            }}
            prefillLabel={prefillLabel}
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
