import { createClient } from "@/lib/supabase/client";

export type DueReminder = {
  id: string;
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
  dueAt: string;
  type: "calendar" | "task" | "application" | "roadmap";
};

export async function fetchDueReminders(): Promise<DueReminder[]> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return [];
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);
  const [events, tasks, applications, roadmapItems] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, event_type, start_time, reminder_time")
      .eq("user_id", user.id)
      .not("reminder_time", "is", null)
      .lte("reminder_time", nowIso)
      .order("reminder_time", { ascending: false })
      .limit(10),
    supabase
      .from("tasks")
      .select("id, title, due_date, status")
      .eq("user_id", user.id)
      .not("due_date", "is", null)
      .lte("due_date", today)
      .neq("status", "done")
      .order("due_date", { ascending: true })
      .limit(10),
    supabase
      .from("applications")
      .select("id, manual_job_title, manual_company, deadline, jobs:job_id(title, company)")
      .eq("user_id", user.id)
      .not("deadline", "is", null)
      .lte("deadline", today)
      .order("deadline", { ascending: true })
      .limit(10),
    supabase
      .from("roadmap_items")
      .select("id, title, due_date, status")
      .eq("user_id", user.id)
      .not("due_date", "is", null)
      .lte("due_date", today)
      .neq("status", "done")
      .order("due_date", { ascending: true })
      .limit(10),
  ]);

  return [
    ...rows(events.data).map((event) => ({
      actionHref: "/calendar",
      actionLabel: "Open Calendar",
      dueAt: stringValue(event.reminder_time) || stringValue(event.start_time),
      id: `calendar-${stringValue(event.id)}`,
      message: `Reminder for ${stringValue(event.title) || "calendar event"}.`,
      title: "Calendar reminder",
      type: "calendar" as const,
    })),
    ...rows(tasks.data).map((task) => ({
      actionHref: "/goals",
      actionLabel: "Open Goals",
      dueAt: `${stringValue(task.due_date)}T12:00:00`,
      id: `task-${stringValue(task.id)}`,
      message: `${stringValue(task.title) || "Task"} is due.`,
      title: "Task due",
      type: "task" as const,
    })),
    ...rows(applications.data).map((application) => ({
      actionHref: "/tracker",
      actionLabel: "Open Tracker",
      dueAt: `${stringValue(application.deadline)}T12:00:00`,
      id: `application-${stringValue(application.id)}`,
      message: `${applicationTitle(application)} has a deadline today or earlier.`,
      title: "Application deadline",
      type: "application" as const,
    })),
    ...rows(roadmapItems.data).map((item) => ({
      actionHref: "/roadmap",
      actionLabel: "Open Roadmap",
      dueAt: `${stringValue(item.due_date)}T12:00:00`,
      id: `roadmap-${stringValue(item.id)}`,
      message: `${stringValue(item.title) || "Roadmap item"} is due.`,
      title: "Roadmap reminder",
      type: "roadmap" as const,
    })),
  ].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

function applicationTitle(row: Record<string, unknown>) {
  const jobs = row.jobs;
  const job = Array.isArray(jobs) ? jobs[0] : jobs;
  const title =
    nullableString(row.manual_job_title) ||
    nullableString((job as Record<string, unknown> | undefined)?.title);
  const company =
    nullableString(row.manual_company) ||
    nullableString((job as Record<string, unknown> | undefined)?.company);
  return [title || "Application", company].filter(Boolean).join(" at ");
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}
