"use client";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RoadmapTimeline } from "@/components/roadmap/RoadmapTimeline";
import { DetailPageSkeleton } from "@/components/ui";
import { useRoadmapDetail } from "@/lib/hooks/useRoadmaps";

type RoadmapDetailClientProps = {
  roadmapId: string;
};

export function RoadmapDetailClient({ roadmapId }: RoadmapDetailClientProps) {
  const { data, error, isLoading } = useRoadmapDetail(roadmapId);

  if (isLoading) {
    return (
      <DetailPageSkeleton contentHeight="h-48" timelineCount={3} />
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
        <div className="mx-auto max-w-5xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error?.message ?? "Roadmap not found."}
        </div>
      </main>
    );
  }

  const { roadmap, items } = data;
  const createdAt = new Date(roadmap.created_at);

  return (
    <main className="min-h-[calc(100vh-49px)] bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/roadmap"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-[#1A56DB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roadmaps
        </Link>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-950">
                {roadmap.target_role}
              </h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
                <span>{roadmap.duration_weeks} weeks</span>
                <span>
                  Created{" "}
                  {Number.isNaN(createdAt.getTime())
                    ? "recently"
                    : format(createdAt, "MMM d, yyyy")}
                </span>
              </div>
              {roadmap.overview ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                  {roadmap.overview}
                </p>
              ) : null}
            </div>
            <div className="min-w-44 rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700">Progress</span>
                <span className="font-semibold text-[#1A56DB]">
                  {roadmap.progress_percent}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-[#1A56DB]"
                  style={{
                    width: `${Math.min(100, roadmap.progress_percent)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <RoadmapTimeline items={items} roadmapId={roadmap.id} />
        </section>
      </div>
    </main>
  );
}
