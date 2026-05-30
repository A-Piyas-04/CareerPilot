"use client";

import { format } from "date-fns";

import { DetailPageShell } from "@/components/layout";
import { RoadmapTimeline } from "@/components/roadmap/RoadmapTimeline";
import { DetailPageSkeleton } from "@/components/ui";
import { useRoadmapDetail } from "@/lib/hooks/useRoadmaps";
import { alertError, chipSky, surfaceCard } from "@/lib/ui-theme";

type RoadmapDetailClientProps = {
  roadmapId: string;
};

export function RoadmapDetailClient({ roadmapId }: RoadmapDetailClientProps) {
  const { data, error, isLoading } = useRoadmapDetail(roadmapId);

  if (isLoading) {
    return <DetailPageSkeleton contentHeight="h-48" timelineCount={3} />;
  }

  if (error || !data) {
    return (
      <DetailPageShell
        backHref="/roadmap"
        backLabel="Back to roadmaps"
        title="Roadmap not found"
      >
        <p className={alertError}>{error?.message ?? "Roadmap not found."}</p>
      </DetailPageShell>
    );
  }

  const { roadmap, items } = data;
  const createdAt = new Date(roadmap.created_at);

  return (
    <DetailPageShell
      backHref="/roadmap"
      backLabel="Back to roadmaps"
      title={roadmap.target_role}
      description={roadmap.overview ?? undefined}
      meta={
        <>
          <span className={chipSky}>{roadmap.duration_weeks} weeks</span>
          <span className="text-xs text-zinc-500">
            Created{" "}
            {Number.isNaN(createdAt.getTime())
              ? "recently"
              : format(createdAt, "MMM d, yyyy")}
          </span>
        </>
      }
      actions={
        <div className={`min-w-44 p-3 ${surfaceCard}`}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-700">Progress</span>
            <span className="font-semibold text-sky-700">{roadmap.progress_percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-700"
              style={{
                width: `${Math.min(100, roadmap.progress_percent)}%`,
              }}
            />
          </div>
        </div>
      }
    >
      <RoadmapTimeline items={items} roadmapId={roadmap.id} />
    </DetailPageShell>
  );
}
