"use client";

import { CheckCircle2, CircleDot, GitPullRequestArrow, Map } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Card, EmptyState } from "@/components/ui";
import type { RecentActivityItem } from "@/lib/dashboard/types";

type RecentActivityFeedProps = {
  items: RecentActivityItem[];
};

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Recent Activity
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Latest progress across modules
      </p>

      {items.length === 0 ? (
        <EmptyState
          className="mt-5 p-5"
          title="No recent activity yet"
          description="Updates from applications, roadmap items, and tasks will appear here."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => {
            const Icon = activityIcon(item.type);
            const date = new Date(item.timestamp);

            return (
              <article className="flex gap-3" key={item.id}>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 border-b border-[var(--border)] pb-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--muted)]">
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
    </Card>
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
