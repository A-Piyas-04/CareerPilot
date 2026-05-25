"use client";

import { format, isTomorrow } from "date-fns";

import type {
  CalendarDisplayEvent,
  CalendarEventType,
} from "@/lib/hooks/useCalendarEvents";

type Props = {
  events: CalendarDisplayEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: CalendarDisplayEvent) => void;
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
    <aside className="w-full rounded-lg border border-zinc-200 bg-white p-4 shadow-sm xl:w-[260px]">
      <h2 className="text-sm font-semibold text-zinc-950">Upcoming Events</h2>

      {upcoming.length ? (
        <ul className="mt-3 space-y-2">
          {upcoming.map((event) => (
            <li key={event.id}>
              <button
                className={`flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left transition ${
                  selectedEventId === event.id
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
                }`}
                type="button"
                onClick={() => onSelectEvent(event)}
              >
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass(
                    event.resource.event_type,
                  )}`}
                />
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
        <p className="mt-3 rounded-md border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">
          No upcoming events
        </p>
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

function dotClass(type: CalendarEventType) {
  if (type === "deadline") {
    return "bg-red-500";
  }
  if (type === "interview") {
    return "bg-blue-500";
  }
  if (type === "reminder") {
    return "bg-yellow-500";
  }
  if (type === "study") {
    return "bg-green-500";
  }
  if (type === "application") {
    return "bg-violet-500";
  }
  return "bg-zinc-500";
}
