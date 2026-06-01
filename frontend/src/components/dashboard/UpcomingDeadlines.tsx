"use client";

import { format, formatDistanceToNow } from "date-fns";

import { Badge, Card, EmptyState } from "@/components/ui";
import type { UpcomingDashboardEvent } from "@/lib/dashboard/types";

type UpcomingDeadlinesProps = {
  events: UpcomingDashboardEvent[];
};

export function UpcomingDeadlines({ events }: UpcomingDeadlinesProps) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        Upcoming Deadlines
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Next calendar items
      </p>

      {events.length === 0 ? (
        <EmptyState
          className="mt-5 p-5"
          title="No upcoming deadlines"
          description="Add interviews, deadlines, reminders, or study blocks to keep your calendar useful."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {events.map((event) => {
            const date = new Date(event.startTime);
            const validDate = !Number.isNaN(date.getTime());

            return (
              <article
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3"
                key={event.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {validDate ? format(date, "MMM d, h:mm a") : "Time not set"}
                    </p>
                  </div>
                  <Badge className="shrink-0 capitalize" tone="primary">
                    {event.eventType}
                  </Badge>
                </div>
                {validDate ? (
                  <p className="mt-2 text-xs font-medium text-[var(--muted-foreground)]">
                    {formatDistanceToNow(date, { addSuffix: true })}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
