"use client";

import { useRouter } from "next/navigation";

import { RoadmapGenerateForm } from "@/components/roadmap/RoadmapGenerateForm";
import { RoadmapList } from "@/components/roadmap/RoadmapList";
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
    <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <RoadmapGenerateForm
          isGenerating={generateRoadmap.isPending}
          onGenerate={handleGenerate}
        />

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
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
    </main>
  );
}
