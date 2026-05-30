"use client";

import { Map } from "lucide-react";

import { RoadmapCard } from "@/components/roadmap/RoadmapCard";
import { EmptyState, ListCardSkeleton } from "@/components/ui";
import type { RoadmapListItem } from "@/lib/roadmap/types";
import { alertError } from "@/lib/ui-theme";

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
    return <div className={`p-4 ${alertError}`}>{error}</div>;
  }

  if (roadmaps.length === 0) {
    return (
      <EmptyState
        accent="sky"
        className="min-h-64"
        description="Generate your first roadmap to turn a target role into weekly action."
        icon={Map}
        title="No roadmaps yet"
      />
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
