"use client";

import { format } from "date-fns";
import { CalendarClock, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui";

import type {
  CalendarDisplayEvent,
  CalendarEventType,
} from "@/lib/hooks/useCalendarEvents";
import { useDeleteCalendarEvent } from "@/lib/hooks/useCalendarEvents";

type Props = {
  event: CalendarDisplayEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarDisplayEvent) => void;
};

export function EventPopover({ event, onClose, onEdit }: Props) {
  const deleteMutation = useDeleteCalendarEvent();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!event) {
    return null;
  }

  const resource = event.resource;
  const isReadOnly = resource.kind === "application_deadline";
  const description =
    resource.kind === "calendar_event" ? resource.event.description : null;
  const linkedTask =
    resource.kind === "calendar_event" ? resource.linked_task_title : null;
  const linkedApplication =
    resource.kind === "calendar_event"
      ? resource.linked_application_title
      : resource.application.title;

  async function handleDelete() {
    if (!event || event.resource.kind !== "calendar_event") {
      return;
    }

    await deleteMutation.mutateAsync(event.resource.event.id);
    setShowDeleteConfirm(false);
    onClose();
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this event?"
        description="This will permanently remove this calendar event."
        confirmLabel="Delete event"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    <div className="absolute right-4 top-4 z-30 w-[min(22rem,calc(100%-2rem))] rounded-lg border border-zinc-200 bg-white p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={badgeClass(resource.event_type)}>
            {eventTypeLabel(resource.event_type)}
          </span>
          <h3 className="mt-2 break-words text-base font-semibold text-zinc-950">
            {event.title}
          </h3>
        </div>
        <button
          className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          type="button"
          onClick={onClose}
          aria-label="Close event details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-zinc-600">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {format(event.start, "MMM d, yyyy h:mm a")}
          {event.end ? ` - ${format(event.end, "h:mm a")}` : ""}
        </span>
      </p>

      {description ? (
        <p className="mt-3 break-words text-sm text-zinc-600">{description}</p>
      ) : null}

      {linkedTask ? (
        <p className="mt-3 text-sm text-zinc-600">
          <span className="font-semibold text-zinc-800">Task:</span> {linkedTask}
        </p>
      ) : null}

      {linkedApplication ? (
        <p className="mt-2 text-sm text-zinc-600">
          <span className="font-semibold text-zinc-800">Application:</span>{" "}
          {linkedApplication}
        </p>
      ) : null}

      {isReadOnly ? (
        <p className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600">
          Application deadlines are read-only calendar items.
        </p>
      ) : (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            type="button"
            onClick={() => onEdit(event)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            className="flex h-9 items-center gap-2 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
    </>
  );
}

function badgeClass(type: CalendarEventType) {
  const base = "inline-flex rounded px-2 py-0.5 text-xs font-semibold";
  if (type === "deadline") {
    return `${base} bg-red-100 text-red-800`;
  }
  if (type === "interview") {
    return `${base} bg-blue-100 text-blue-800`;
  }
  if (type === "reminder") {
    return `${base} bg-yellow-100 text-yellow-800`;
  }
  if (type === "study") {
    return `${base} bg-green-100 text-green-800`;
  }
  if (type === "application") {
    return `${base} bg-violet-100 text-violet-800`;
  }
  return `${base} bg-zinc-100 text-zinc-700`;
}

function eventTypeLabel(type: CalendarEventType) {
  return type.slice(0, 1).toUpperCase() + type.slice(1);
}
