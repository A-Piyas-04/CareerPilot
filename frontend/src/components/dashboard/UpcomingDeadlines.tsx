"use client";

import { CalendarClock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import { Badge, EmptyState } from "@/components/ui";
import type { UpcomingDashboardEvent } from "@/lib/dashboard/types";
import { surfaceCard, surfaceCardHeader } from "@/lib/ui-theme";

type UpcomingDeadlinesProps = {
  events: UpcomingDashboardEvent[];
};

export function UpcomingDeadlines({ events }: UpcomingDeadlinesProps) {
  return (
    <section className={`overflow-hidden ${surfaceCard}`}>
      <div className={surfaceCardHeader("violet")}>
        <h2 className="text-lg font-semibold text-zinc-950">Upcoming Deadlines</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Next calendar items</p>
      </div>

      <div className="p-5">
        {events.length === 0 ? (
          <EmptyState
            accent="violet"
            icon={CalendarClock}
            title="No upcoming deadlines"
            description="Add events on the calendar or save job deadlines to see them here."
            variant="filled"
          />
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const date = new Date(event.startTime);
              const validDate = !Number.isNaN(date.getTime());

              return (
                <article
                  className="rounded-xl border border-violet-100/80 bg-gradient-to-r from-violet-50/40 to-white p-3 ring-1 ring-violet-100/50"
                  key={event.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-950">
                        {event.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {validDate ? format(date, "MMM d, h:mm a") : "Time not set"}
                      </p>
                    </div>
                    <Badge tone="deadline" className="shrink-0 capitalize">
                      {event.eventType}
                    </Badge>
                  </div>
                  {validDate ? (
                    <p className="mt-2 text-xs font-medium text-violet-700/80">
                      {formatDistanceToNow(date, { addSuffix: true })}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
