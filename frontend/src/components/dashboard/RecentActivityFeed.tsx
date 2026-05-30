"use client";

import { CheckCircle2, CircleDot, GitPullRequestArrow, Map } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { EmptyState } from "@/components/ui";
import type { RecentActivityItem } from "@/lib/dashboard/types";
import { surfaceCard, surfaceCardHeader } from "@/lib/ui-theme";

type RecentActivityFeedProps = {
  items: RecentActivityItem[];
};

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <section className={`overflow-hidden ${surfaceCard}`}>
      <div className={surfaceCardHeader("violet")}>
        <h2 className="text-lg font-semibold text-zinc-950">Recent Activity</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Latest progress across modules</p>
      </div>

      <div className="p-5">
        {items.length === 0 ? (
          <EmptyState
            accent="violet"
            icon={CircleDot}
            title="No recent activity yet"
            description="Apply to jobs, complete tasks, or update your roadmap to see activity here."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = activityIcon(item.type);
              const date = new Date(item.timestamp);

              return (
                <article className="flex gap-3" key={item.id}>
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-900 text-white shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 border-b border-zinc-100 pb-3">
                    <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">
                      {Number.isNaN(date.getTime())
                        ? "Recently"
                        : formatDistanceToNow(date, { addSuffix: true })}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function activityIcon(type: RecentActivityItem["type"]) {
  if (type === "application") {
    return GitPullRequestArrow;
  }
  if (type === "roadmap") {
    return Map;
  }
  if (type === "task") {
    return CheckCircle2;
  }
  return CircleDot;
}
