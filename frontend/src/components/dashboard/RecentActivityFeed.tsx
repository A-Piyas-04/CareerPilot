"use client";

import { CheckCircle2, CircleDot, GitPullRequestArrow, Map } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { RecentActivityItem } from "@/lib/dashboard/types";

type RecentActivityFeedProps = {
  items: RecentActivityItem[];
};

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">Recent Activity</h2>
      <p className="mt-1 text-sm text-zinc-500">Latest progress across modules</p>

      {items.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          No recent activity yet.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => {
            const Icon = activityIcon(item.type);
            const date = new Date(item.timestamp);

            return (
              <article className="flex gap-3" key={item.id}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1A56DB]">
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
