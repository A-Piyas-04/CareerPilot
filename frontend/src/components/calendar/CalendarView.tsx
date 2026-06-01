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
import { Briefcase, CalendarDays, CalendarPlus, ListTodo } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar } from "react-big-calendar";

import type {
  CalendarDisplayEvent,
  CalendarEventType,
} from "@/lib/hooks/useCalendarEvents";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";

import { Button, PageHeader, Skeleton, Tabs, buttonClassName } from "@/components/ui";

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
    <main className="cp-page flex min-h-screen flex-col">
      <section className="cp-container py-6">
        <PageHeader
          eyebrow="Schedule"
          icon={CalendarDays}
          title="Calendar"
          description="Plan interviews, deadlines, reminders, and study blocks in one calm schedule."
          actions={
            <>
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/goals"
            >
              <ListTodo className="h-4 w-4" />
              Goals
            </Link>
            <Link
              className={buttonClassName({ variant: "secondary" })}
              href="/tracker"
            >
              <Briefcase className="h-4 w-4" />
              Tracker
            </Link>
            <Button onClick={() => handleAddEvent()}>
              <CalendarPlus className="h-4 w-4" />
              Add Event
            </Button>
            </>
          }
        />
      </section>

      <section className="cp-container flex flex-1 flex-col gap-5 pb-6 xl:flex-row">
        <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs
              label="Calendar view"
              value={view}
              onChange={setView}
              items={[
                { value: Views.MONTH, label: "Month" },
                { value: Views.WEEK, label: "Week" },
              ]}
            />

            {eventsQuery.error ? (
              <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
                {eventsQuery.error.message}
              </p>
            ) : null}
          </div>

          <div className="relative min-h-[680px]">
            {eventsQuery.isLoading ? (
              <Skeleton className="absolute inset-0 rounded-[var(--radius-md)]" aria-label="Loading calendar" />
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
