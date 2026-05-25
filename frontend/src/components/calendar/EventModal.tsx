"use client";

import { format, parseISO } from "date-fns";
import { Loader2, Save, X } from "lucide-react";
import { FormEvent, useState } from "react";

import type {
  CalendarDisplayEvent,
  CalendarEventInput,
  CalendarEventType,
} from "@/lib/hooks/useCalendarEvents";
import {
  useCalendarApplicationOptions,
  useCalendarTaskOptions,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
} from "@/lib/hooks/useCalendarEvents";

type Props = {
  event: CalendarDisplayEvent | null;
  initialStart: Date | null;
  isOpen: boolean;
  onClose: () => void;
};

const EVENT_TYPES: CalendarEventType[] = [
  "deadline",
  "interview",
  "reminder",
  "study",
  "application",
  "custom",
];

export function EventModal({ event, initialStart, isOpen, onClose }: Props) {
  if (!isOpen) {
    return null;
  }

  const editableEvent =
    event?.resource.kind === "calendar_event" ? event.resource.event : null;

  return (
    <EventModalContent
      key={editableEvent?.id ?? initialStart?.toISOString() ?? "new-event"}
      event={event}
      initialStart={initialStart}
      onClose={onClose}
    />
  );
}

function EventModalContent({
  event,
  initialStart,
  onClose,
}: {
  event: CalendarDisplayEvent | null;
  initialStart: Date | null;
  onClose: () => void;
}) {
  const createMutation = useCreateCalendarEvent();
  const updateMutation = useUpdateCalendarEvent();
  const tasksQuery = useCalendarTaskOptions();
  const applicationsQuery = useCalendarApplicationOptions();
  const editableEvent =
    event?.resource.kind === "calendar_event" ? event.resource.event : null;
  const isEditing = Boolean(editableEvent);
  const [form, setForm] = useState({
    title: editableEvent?.title ?? "",
    event_type: editableEvent?.event_type ?? ("custom" as CalendarEventType),
    start_time: toDateTimeLocal(editableEvent?.start_time, initialStart),
    end_time: toDateTimeLocal(editableEvent?.end_time, null),
    reminder_time: toDateTimeLocal(editableEvent?.reminder_time, null),
    description: editableEvent?.description ?? "",
    task_id: editableEvent?.task_id ?? "",
    application_id: editableEvent?.application_id ?? "",
  });
  const mutation = isEditing ? updateMutation : createMutation;

  async function handleSubmit(eventSubmit: FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();

    const input: CalendarEventInput = {
      title: form.title,
      event_type: form.event_type,
      start_time: form.start_time,
      end_time: form.end_time || undefined,
      reminder_time: form.reminder_time || undefined,
      description: form.description || undefined,
      task_id: form.task_id || undefined,
      application_id: form.application_id || undefined,
    };

    if (isEditing && editableEvent) {
      await updateMutation.mutateAsync({ eventId: editableEvent.id, input });
    } else {
      await createMutation.mutateAsync(input);
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/30">
      <div className="mx-auto mt-10 flex max-h-[calc(100vh-5rem)] w-[calc(100%-2rem)] max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Calendar
            </p>
            <h2 className="text-lg font-semibold text-zinc-950">
              {isEditing ? "Edit event" : "Add event"}
            </h2>
          </div>
          <button
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            <Field label="Title" required>
              <input
                className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.title}
                onChange={(inputEvent) =>
                  setForm({ ...form, title: inputEvent.target.value })
                }
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event Type">
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  value={form.event_type}
                  onChange={(inputEvent) =>
                    setForm({
                      ...form,
                      event_type: inputEvent.target.value as CalendarEventType,
                    })
                  }
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {eventTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Reminder Time">
                <input
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  type="datetime-local"
                  value={form.reminder_time}
                  onChange={(inputEvent) =>
                    setForm({ ...form, reminder_time: inputEvent.target.value })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date & Time" required>
                <input
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(inputEvent) =>
                    setForm({ ...form, start_time: inputEvent.target.value })
                  }
                  required
                />
              </Field>

              <Field label="End Date & Time">
                <input
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(inputEvent) =>
                    setForm({ ...form, end_time: inputEvent.target.value })
                  }
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className="min-h-28 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                value={form.description}
                onChange={(inputEvent) =>
                  setForm({ ...form, description: inputEvent.target.value })
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link to Task">
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  value={form.task_id}
                  onChange={(inputEvent) =>
                    setForm({ ...form, task_id: inputEvent.target.value })
                  }
                >
                  <option value="">No linked task</option>
                  {(tasksQuery.data ?? []).map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Link to Application">
                <select
                  className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  value={form.application_id}
                  onChange={(inputEvent) =>
                    setForm({ ...form, application_id: inputEvent.target.value })
                  }
                >
                  <option value="">No linked application</option>
                  {(applicationsQuery.data ?? []).map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.title}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {mutation.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {mutation.error.message}
              </p>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-zinc-200 p-5">
            <button
              className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:bg-emerald-400"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  children,
  label,
  required,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function toDateTimeLocal(value: string | null | undefined, fallback: Date | null) {
  if (value) {
    return format(parseISO(value), "yyyy-MM-dd'T'HH:mm");
  }

  if (fallback) {
    return format(fallback, "yyyy-MM-dd'T'HH:mm");
  }

  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

function eventTypeLabel(type: CalendarEventType) {
  return type
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
