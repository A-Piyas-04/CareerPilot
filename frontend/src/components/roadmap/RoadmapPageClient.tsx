"use client";

import { Map } from "lucide-react";
import { useRouter } from "next/navigation";

import { RoadmapGenerateForm } from "@/components/roadmap/RoadmapGenerateForm";
import { RoadmapList } from "@/components/roadmap/RoadmapList";
import { Card, PageHeader, SubmissionProgress } from "@/components/ui";
import { ROADMAP_GENERATE_STEPS } from "@/lib/progress/roadmap-progress";
import { useGenerateRoadmap, useRoadmaps } from "@/lib/hooks/useRoadmaps";
import type { GenerateRoadmapRequest } from "@/lib/roadmap/types";

export function RoadmapPageClient() {
  const router = useRouter();
  const roadmaps = useRoadmaps();
  const generateRoadmap = useGenerateRoadmap();

  const handleGenerate = (payload: GenerateRoadmapRequest) => {
    generateRoadmap.mutate(payload, {
      onSuccess: (data) => {
        router.push(`/roadmap/${data.roadmapId}`);
      },
    });
  };

  return (
    <main className="cp-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Learning"
          icon={Map}
          title="Roadmap Studio"
          description="Generate structured learning plans, then turn items into tasks and calendar commitments."
        />
      </div>
      <div className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <RoadmapGenerateForm
            isGenerating={generateRoadmap.isPending}
            onGenerate={handleGenerate}
          />
          <SubmissionProgress
            isActive={generateRoadmap.isPending}
            mode="simulated"
            steps={[...ROADMAP_GENERATE_STEPS]}
            tone="blue"
          />
        </div>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Saved roadmaps
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Open any roadmap to track progress and schedule work.
            </p>
          </div>
          <RoadmapList
            error={roadmaps.error?.message}
            isLoading={roadmaps.isLoading}
            roadmaps={roadmaps.data?.roadmaps ?? []}
          />
        </Card>
      </div>
    </main>
  );
}
