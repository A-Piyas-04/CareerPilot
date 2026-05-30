"use client";

import { format, formatDistanceToNow } from "date-fns";

import type { UpcomingDashboardEvent } from "@/lib/dashboard/types";

type UpcomingDeadlinesProps = {
  events: UpcomingDashboardEvent[];
};

export function UpcomingDeadlines({ events }: UpcomingDeadlinesProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">Upcoming Deadlines</h2>
      <p className="mt-1 text-sm text-zinc-500">Next calendar items</p>

      {events.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          No upcoming deadlines.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {events.map((event) => {
            const date = new Date(event.startTime);
            const validDate = !Number.isNaN(date.getTime());

            return (
              <article
                className="rounded-md border border-zinc-200 p-3"
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
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold capitalize text-emerald-800">
                    {event.eventType}
                  </span>
                </div>
                {validDate ? (
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    {formatDistanceToNow(date, { addSuffix: true })}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
