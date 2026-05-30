"use client";

import { CalendarDays } from "lucide-react";
import { format, isTomorrow } from "date-fns";

import { EmptyState } from "@/components/ui";
import type {
  CalendarDisplayEvent,
  CalendarEventType,
} from "@/lib/hooks/useCalendarEvents";
import { surfaceCardElevated } from "@/lib/ui-theme";

type Props = {
  events: CalendarDisplayEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: CalendarDisplayEvent) => void;
};

const BORDER_COLORS: Record<CalendarEventType, string> = {
  deadline: "border-l-red-500",
  interview: "border-l-sky-500",
  reminder: "border-l-amber-500",
  study: "border-l-emerald-500",
  application: "border-l-violet-500",
  custom: "border-l-zinc-400",
};

export function UpcomingSidebar({
  events,
  onSelectEvent,
  selectedEventId,
}: Props) {
  const upcoming = events
    .filter((event) => event.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 7);

  return (
    <aside className={`w-full p-4 xl:w-[280px] ${surfaceCardElevated}`}>
      <h2 className="text-sm font-semibold text-zinc-950">Upcoming Events</h2>
      <p className="mt-0.5 text-xs text-zinc-500">Next 7 scheduled items</p>

      {upcoming.length ? (
        <ul className="mt-3 space-y-2">
          {upcoming.map((event) => (
            <li key={event.id}>
              <button
                className={`flex w-full items-start gap-2 rounded-xl border border-l-4 bg-white px-3 py-2.5 text-left transition ${
                  BORDER_COLORS[event.resource.event_type] ?? BORDER_COLORS.custom
                } ${
                  selectedEventId === event.id
                    ? "border-violet-300 bg-violet-50/50 shadow-sm"
                    : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-sm"
                }`}
                type="button"
                onClick={() => onSelectEvent(event)}
              >
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-zinc-900">
                    {event.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {formatUpcomingDate(event.start)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            accent="violet"
            icon={CalendarDays}
            title="No upcoming events"
            description="Add deadlines, interviews, or study blocks to see them here."
            variant="filled"
          />
        </div>
      )}
    </aside>
  );
}

function formatUpcomingDate(value: Date) {
  if (isTomorrow(value)) {
    return `Tomorrow at ${format(value, "h:mm a")}`;
  }

  return format(value, "MMM d 'at' h:mm a");
}
