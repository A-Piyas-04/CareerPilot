"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  dateFnsLocalizer,
  Views,
  type EventPropGetter,
  type View,
} from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { Briefcase, CalendarPlus, ListTodo, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Calendar } from "react-big-calendar";

import { createClient } from "@/lib/supabase/client";
import type {
  CalendarDisplayEvent,
  CalendarEventType,
} from "@/lib/hooks/useCalendarEvents";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";

import { Skeleton } from "@/components/ui";

import { EventModal } from "./EventModal";
import { EventPopover } from "./EventPopover";
import { UpcomingSidebar } from "./UpcomingSidebar";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function CalendarView() {
  const router = useRouter();
  const eventsQuery = useCalendarEvents();
  const [view, setView] = useState<View>(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState<CalendarDisplayEvent | null>(
    null,
  );
  const [editingEvent, setEditingEvent] = useState<CalendarDisplayEvent | null>(
    null,
  );
  const [modalStart, setModalStart] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function handleAddEvent(start: Date | null = null) {
    setSelectedEvent(null);
    setEditingEvent(null);
    setModalStart(start);
    setIsModalOpen(true);
  }

  function handleEditEvent(event: CalendarDisplayEvent) {
    setEditingEvent(event);
    setSelectedEvent(null);
    setModalStart(null);
    setIsModalOpen(true);
  }

  function handleSelectEvent(event: CalendarDisplayEvent) {
    setSelectedEvent(event);
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7f9]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              CareerPilot
            </p>
            <h1 className="text-2xl font-semibold text-zinc-950">Calendar</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href="/goals"
            >
              <ListTodo className="h-4 w-4" />
              Goals
            </Link>
            <Link
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              href="/tracker"
            >
              <Briefcase className="h-4 w-4" />
              Tracker
            </Link>
            <button
              className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="button"
              onClick={() => handleAddEvent()}
            >
              <CalendarPlus className="h-4 w-4" />
              Add Event
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-5 px-5 py-5 xl:flex-row">
        <div className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-md border border-zinc-300 bg-white p-1">
              <button
                className={`h-8 rounded px-3 text-sm font-semibold ${
                  view === Views.MONTH
                    ? "bg-emerald-700 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
                type="button"
                onClick={() => setView(Views.MONTH)}
              >
                Month
              </button>
              <button
                className={`h-8 rounded px-3 text-sm font-semibold ${
                  view === Views.WEEK
                    ? "bg-emerald-700 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
                type="button"
                onClick={() => setView(Views.WEEK)}
              >
                Week
              </button>
            </div>

            {eventsQuery.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {eventsQuery.error.message}
              </p>
            ) : null}
          </div>

          <div className="relative min-h-[680px]">
            {eventsQuery.isLoading ? (
              <Skeleton className="absolute inset-0 rounded-lg" aria-label="Loading calendar" />
            ) : null}
            <Calendar<CalendarDisplayEvent>
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              views={[Views.MONTH, Views.WEEK]}
              onView={(nextView) => setView(nextView)}
              selectable
              popup
              style={{ minHeight: 680 }}
              eventPropGetter={eventPropGetter(selectedEvent?.id ?? null)}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={(slotInfo) => handleAddEvent(slotInfo.start)}
            />

            <EventPopover
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onEdit={handleEditEvent}
            />
          </div>
        </div>

        <UpcomingSidebar
          events={events}
          selectedEventId={selectedEvent?.id ?? null}
          onSelectEvent={handleSelectEvent}
        />
      </section>

      <EventModal
        event={editingEvent}
        initialStart={modalStart}
        isOpen={isModalOpen}
        onClose={() => {
          setEditingEvent(null);
          setModalStart(null);
          setIsModalOpen(false);
        }}
      />
    </main>
  );
}

function eventPropGetter(
  selectedEventId: string | null,
): EventPropGetter<CalendarDisplayEvent> {
  return (event) => {
    const colors = eventColor(event.resource.event_type);
    const isSelected = event.id === selectedEventId;

    return {
      style: {
        backgroundColor: colors.background,
        border: isSelected ? "2px solid #047857" : "1px solid transparent",
        borderRadius: "6px",
        color: colors.text,
        fontWeight: 700,
        padding: "2px 6px",
      },
    };
  };
}

function eventColor(type: CalendarEventType) {
  if (type === "deadline") {
    return { background: "#FEE2E2", text: "#991B1B" };
  }
  if (type === "interview") {
    return { background: "#DBEAFE", text: "#1E40AF" };
  }
  if (type === "reminder") {
    return { background: "#FEF9C3", text: "#854D0E" };
  }
  if (type === "study") {
    return { background: "#DCFCE7", text: "#166534" };
  }
  if (type === "application") {
    return { background: "#EDE9FE", text: "#5B21B6" };
  }
  return { background: "#F3F4F6", text: "#374151" };
}
