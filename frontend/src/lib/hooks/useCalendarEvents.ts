"use client";

import { addHours, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export type CalendarEventType =
  | "deadline"
  | "interview"
  | "reminder"
  | "study"
  | "application"
  | "custom";

export type CalendarEvent = {
  id: string;
  user_id: string;
  task_id: string | null;
  application_id: string | null;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  start_time: string;
  end_time: string | null;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarTaskOption = {
  id: string;
  title: string;
};

export type CalendarApplicationOption = {
  id: string;
  title: string;
  company: string | null;
  deadline: string | null;
};

export type CalendarDisplayEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: CalendarEventResource;
};

export type CalendarEventResource =
  | {
      kind: "calendar_event";
      event: CalendarEvent;
      event_type: CalendarEventType;
      linked_task_title: string | null;
      linked_application_title: string | null;
    }
  | {
      kind: "application_deadline";
      application: CalendarApplicationOption;
      event_type: "deadline";
    };

export type CalendarEventInput = {
  title: string;
  event_type: CalendarEventType;
  start_time: string;
  end_time?: string;
  reminder_time?: string;
  description?: string;
  task_id?: string;
  application_id?: string;
};

type CalendarEventRow = CalendarEvent & {
  tasks?: { title: string | null } | { title: string | null }[] | null;
  applications?:
    | {
        manual_job_title: string | null;
        manual_company: string | null;
      }
    | {
        manual_job_title: string | null;
        manual_company: string | null;
      }[]
    | null;
};

type ApplicationRow = {
  id: string;
  manual_job_title: string | null;
  manual_company: string | null;
  deadline: string | null;
  jobs?:
    | { title: string | null; company: string | null }
    | { title: string | null; company: string | null }[]
    | null;
};

export const calendarKeys = {
  events: ["calendar-events"] as const,
  tasks: ["calendar-task-options"] as const,
  applications: ["calendar-application-options"] as const,
};

export function useCalendarEvents() {
  return useQuery({
    queryKey: calendarKeys.events,
    queryFn: fetchCalendarDisplayEvents,
  });
}

export function useCalendarTaskOptions() {
  return useQuery({
    queryKey: calendarKeys.tasks,
    queryFn: fetchTaskOptions,
  });
}

export function useCalendarApplicationOptions() {
  return useQuery({
    queryKey: calendarKeys.applications,
    queryFn: fetchApplicationOptions,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CalendarEventInput) => {
      try {
        return await createCalendarEvent(input);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: calendarKeys.events });
      const previous = queryClient.getQueryData<CalendarDisplayEvent[]>(
        calendarKeys.events,
      );
      const userId = await getCurrentUserId();
      const now = new Date().toISOString();
      const optimisticEvent = calendarEventToDisplay({
        event: {
          id: `temp-${crypto.randomUUID()}`,
          user_id: userId,
          task_id: input.task_id || null,
          application_id: input.application_id || null,
          title: input.title,
          description: input.description || null,
          event_type: input.event_type,
          start_time: toIsoDateTime(input.start_time),
          end_time: input.end_time ? toIsoDateTime(input.end_time) : null,
          reminder_time: input.reminder_time
            ? toIsoDateTime(input.reminder_time)
            : null,
          created_at: now,
          updated_at: now,
        },
        linked_task_title: null,
        linked_application_title: null,
      });

      queryClient.setQueryData<CalendarDisplayEvent[]>(
        calendarKeys.events,
        (current) => [...(current ?? []), optimisticEvent],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(calendarKeys.events, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.events });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      input,
    }: {
      eventId: string;
      input: CalendarEventInput;
    }) => {
      try {
        return await updateCalendarEvent(eventId, input);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async ({ eventId, input }) => {
      await queryClient.cancelQueries({ queryKey: calendarKeys.events });
      const previous = queryClient.getQueryData<CalendarDisplayEvent[]>(
        calendarKeys.events,
      );

      queryClient.setQueryData<CalendarDisplayEvent[]>(
        calendarKeys.events,
        (current) =>
          current?.map((item) =>
            item.id === eventId && item.resource.kind === "calendar_event"
              ? calendarEventToDisplay({
                  event: {
                    ...item.resource.event,
                    title: input.title,
                    description: input.description || null,
                    event_type: input.event_type,
                    start_time: toIsoDateTime(input.start_time),
                    end_time: input.end_time ? toIsoDateTime(input.end_time) : null,
                    reminder_time: input.reminder_time
                      ? toIsoDateTime(input.reminder_time)
                      : null,
                    task_id: input.task_id || null,
                    application_id: input.application_id || null,
                    updated_at: new Date().toISOString(),
                  },
                  linked_task_title: item.resource.linked_task_title,
                  linked_application_title:
                    item.resource.linked_application_title,
                })
              : item,
          ) ?? [],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(calendarKeys.events, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.events });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      try {
        await deleteCalendarEvent(eventId);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: calendarKeys.events });
      const previous = queryClient.getQueryData<CalendarDisplayEvent[]>(
        calendarKeys.events,
      );

      queryClient.setQueryData<CalendarDisplayEvent[]>(
        calendarKeys.events,
        (current) => current?.filter((item) => item.id !== eventId) ?? [],
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(calendarKeys.events, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.events });
    },
  });
}

async function fetchCalendarDisplayEvents() {
  const [events, applications] = await Promise.all([
    fetchCalendarEvents(),
    fetchApplicationOptions(),
  ]);

  return [
    ...events.map(calendarEventToDisplay),
    ...applications
      .filter((application) => Boolean(application.deadline))
      .map(applicationDeadlineToDisplay),
  ];
}

async function fetchCalendarEvents() {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      "*, tasks:task_id(title), applications:application_id(manual_job_title, manual_company)",
    )
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  if (error) {
    showErrorToast(error.message);
    throw new Error(error.message);
  }

  return ((data ?? []) as CalendarEventRow[]).map((row) => {
    const task = Array.isArray(row.tasks) ? row.tasks[0] : row.tasks;
    const application = Array.isArray(row.applications)
      ? row.applications[0]
      : row.applications;

    return {
      event: stripJoinedFields(row),
      linked_task_title: task?.title ?? null,
      linked_application_title: application
        ? getApplicationTitle({
            title: application.manual_job_title,
            company: application.manual_company,
          })
        : null,
    };
  });
}

async function fetchTaskOptions() {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("user_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    showErrorToast(error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as CalendarTaskOption[];
}

async function fetchApplicationOptions() {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("applications")
    .select("id, manual_job_title, manual_company, deadline, jobs:job_id(title, company)")
    .eq("user_id", userId)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (error) {
    showErrorToast(error.message);
    throw new Error(error.message);
  }

  return ((data ?? []) as ApplicationRow[]).map((application) => {
    const job = Array.isArray(application.jobs)
      ? application.jobs[0]
      : application.jobs;

    return {
      id: application.id,
      title: getApplicationTitle({
        title: application.manual_job_title ?? job?.title ?? null,
        company: application.manual_company ?? job?.company ?? null,
      }),
      company: application.manual_company ?? job?.company ?? null,
      deadline: application.deadline,
    };
  });
}

async function createCalendarEvent(input: CalendarEventInput) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(buildEventPayload(input, userId))
    .select(
      "*, tasks:task_id(title), applications:application_id(manual_job_title, manual_company)",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as CalendarEventRow;
  const task = Array.isArray(row.tasks) ? row.tasks[0] : row.tasks;
  const application = Array.isArray(row.applications)
    ? row.applications[0]
    : row.applications;

  return calendarEventToDisplay({
    event: stripJoinedFields(row),
    linked_task_title: task?.title ?? null,
    linked_application_title: application
      ? getApplicationTitle({
          title: application.manual_job_title,
          company: application.manual_company,
        })
      : null,
  });
}

async function updateCalendarEvent(eventId: string, input: CalendarEventInput) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .update(buildEventPayload(input, userId))
    .eq("id", eventId)
    .eq("user_id", userId)
    .select(
      "*, tasks:task_id(title), applications:application_id(manual_job_title, manual_company)",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as CalendarEventRow;
  const task = Array.isArray(row.tasks) ? row.tasks[0] : row.tasks;
  const application = Array.isArray(row.applications)
    ? row.applications[0]
    : row.applications;

  return calendarEventToDisplay({
    event: stripJoinedFields(row),
    linked_task_title: task?.title ?? null,
    linked_application_title: application
      ? getApplicationTitle({
          title: application.manual_job_title,
          company: application.manual_company,
        })
      : null,
  });
}

async function deleteCalendarEvent(eventId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You need to sign in again.");
  }

  return user.id;
}

function buildEventPayload(input: CalendarEventInput, userId: string) {
  return {
    user_id: userId,
    title: input.title.trim(),
    event_type: input.event_type,
    start_time: toIsoDateTime(input.start_time),
    end_time: input.end_time ? toIsoDateTime(input.end_time) : null,
    reminder_time: input.reminder_time ? toIsoDateTime(input.reminder_time) : null,
    description: input.description?.trim() || null,
    task_id: input.task_id || null,
    application_id: input.application_id || null,
  };
}

function calendarEventToDisplay({
  event,
  linked_application_title,
  linked_task_title,
}: {
  event: CalendarEvent;
  linked_application_title: string | null;
  linked_task_title: string | null;
}): CalendarDisplayEvent {
  const start = parseISO(event.start_time);
  const end = event.end_time ? parseISO(event.end_time) : addHours(start, 1);

  return {
    id: event.id,
    title: event.title,
    start,
    end,
    resource: {
      kind: "calendar_event",
      event,
      event_type: event.event_type,
      linked_task_title,
      linked_application_title,
    },
  };
}

function applicationDeadlineToDisplay(
  application: CalendarApplicationOption,
): CalendarDisplayEvent {
  const start = new Date(`${application.deadline}T12:00:00`);

  return {
    id: `application-deadline-${application.id}`,
    title: `Deadline: ${application.title}`,
    start,
    end: addHours(start, 1),
    allDay: true,
    resource: {
      kind: "application_deadline",
      application,
      event_type: "deadline",
    },
  };
}

function stripJoinedFields(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    user_id: row.user_id,
    task_id: row.task_id,
    application_id: row.application_id,
    title: row.title,
    description: row.description,
    event_type: row.event_type,
    start_time: row.start_time,
    end_time: row.end_time,
    reminder_time: row.reminder_time,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

function getApplicationTitle({
  company,
  title,
}: {
  company: string | null;
  title: string | null;
}) {
  const jobTitle = title ?? "Untitled application";
  return company ? `${jobTitle} at ${company}` : jobTitle;
}

function showErrorToast(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("careerpilot-toast", {
      detail: { type: "error", message },
    }),
  );

  window.alert(message);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Calendar request failed.";
}
