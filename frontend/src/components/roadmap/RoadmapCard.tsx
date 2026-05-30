"use client";

import { format } from "date-fns";
import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

import type { RoadmapListItem } from "@/lib/roadmap/types";
import { surfaceCard } from "@/lib/ui-theme";

type RoadmapCardProps = {
  roadmap: RoadmapListItem;
};

export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  return (
    <article className={`p-4 transition hover:border-sky-200 hover:shadow-md ${surfaceCard}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            {roadmap.target_role}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span>{roadmap.duration_weeks} weeks</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {safeDate(roadmap.created_at)}
            </span>
          </div>
        </div>
        <Link
          href={`/roadmap/${roadmap.id}`}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          Open
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {roadmap.overview ? (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
          {roadmap.overview}
        </p>
      ) : null}

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {roadmap.completed_count} of {roadmap.item_count} weeks complete
          </span>
          <span>{roadmap.progress_percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-700"
            style={{ width: `${Math.min(100, roadmap.progress_percent)}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : format(date, "MMM d");
}
