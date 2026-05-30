"use client";

import { Map } from "lucide-react";

import { RoadmapCard } from "@/components/roadmap/RoadmapCard";
import { ListCardSkeleton } from "@/components/ui";
import type { RoadmapListItem } from "@/lib/roadmap/types";

type RoadmapListProps = {
  error?: string;
  isLoading: boolean;
  roadmaps: RoadmapListItem[];
};

export function RoadmapList({ error, isLoading, roadmaps }: RoadmapListProps) {
  if (isLoading) {
    return <ListCardSkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#1A56DB]">
          <Map className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-zinc-950">
          No roadmaps yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-600">
          Generate your first roadmap to turn a target role into weekly action.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {roadmaps.map((roadmap) => (
        <RoadmapCard key={roadmap.id} roadmap={roadmap} />
      ))}
    </div>
  );
}
