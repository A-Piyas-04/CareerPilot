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
import { CalendarDays, CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Calendar } from "react-big-calendar";

import { PageHeader, PageShell } from "@/components/layout";
import { Skeleton } from "@/components/ui";
import type {
  CalendarDisplayEvent,
  CalendarEventType,
} from "@/lib/hooks/useCalendarEvents";
import { useCalendarEvents } from "@/lib/hooks/useCalendarEvents";
import { PAGE_RELATED_LINKS } from "@/lib/navigation-config";
import { getPageAccentStyles } from "@/lib/nav-styles";
import { btnPrimary, premiumCard } from "@/lib/ui-theme";

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
    <PageShell width="wide">
      <PageHeader
        accent="violet"
        eyebrowText="Track"
        icon={CalendarDays}
        title="Calendar"
        description="See deadlines, interviews, and roadmap milestones alongside your goals and tracker."
        relatedLinks={PAGE_RELATED_LINKS["/calendar"]}
        actions={
          <button
            className={btnPrimary}
            type="button"
            onClick={() => handleAddEvent()}
          >
            <CalendarPlus className="h-4 w-4" />
            Add Event
          </button>
        }
      />

      <div className="flex flex-1 flex-col gap-5 xl:flex-row">
        <div className={`min-w-0 flex-1 overflow-hidden p-4 ${premiumCard}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-full border border-zinc-200 bg-white p-1 ring-1 ring-zinc-100">
              <button
                className={`h-8 rounded-full px-4 text-sm font-semibold transition ${
                  view === Views.MONTH
                    ? getPageAccentStyles("violet").pillActive
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
                type="button"
                onClick={() => setView(Views.MONTH)}
              >
                Month
              </button>
              <button
                className={`h-8 rounded-full px-4 text-sm font-semibold transition ${
                  view === Views.WEEK
                    ? getPageAccentStyles("violet").pillActive
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
              <div className="absolute inset-0 grid grid-cols-7 gap-1 p-2" aria-label="Loading calendar">
                {Array.from({ length: 35 }, (_, i) => (
                  <Skeleton key={i} className="min-h-[88px] rounded-lg" />
                ))}
              </div>
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
      </div>

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
    </PageShell>
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
