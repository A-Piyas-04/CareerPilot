import { startOfWeek } from "date-fns";

import { calculateWeeklyStreak } from "@/lib/dashboard/calculateWeeklyStreak";
import {
  PIPELINE_STATUSES,
  type DashboardMetricsResponse,
  type RecentActivityItem,
  type UpcomingDashboardEvent,
} from "@/lib/dashboard/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DbRow = Record<string, unknown>;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError("User not authenticated", 401);
    }

    const userId = user.id;
    const nowIso = new Date().toISOString();
    const [
      applicationsResult,
      roadmapsResult,
      completedTasksResult,
      upcomingEventsResult,
    ] = await Promise.all([
      supabase
        .from("applications")
        .select("id, status, manual_job_title, manual_company, job_id")
        .eq("user_id", userId),
      supabase
        .from("roadmaps")
        .select("id, progress_percent")
        .eq("user_id", userId),
      supabase
        .from("tasks")
        .select("id, title, completed_at, status")
        .eq("user_id", userId)
        .eq("status", "done")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false }),
      supabase
        .from("calendar_events")
        .select("id, title, event_type, start_time")
        .eq("user_id", userId)
        .gt("start_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(5),
    ]);

    const firstError =
      applicationsResult.error ||
      completedTasksResult.error ||
      upcomingEventsResult.error;

    if (firstError) {
      return jsonError(firstError.message, 500);
    }

    const applications = asRows(applicationsResult.data);
    const roadmaps = roadmapsResult.error ? [] : asRows(roadmapsResult.data);
    const completedTasks = asRows(completedTasksResult.data);
    const roadmapIds = roadmaps
      .map((roadmap) => stringValue(roadmap.id))
      .filter(Boolean);
    const [roadmapItems, applicationHistory, jobsById] = await Promise.all([
      fetchRoadmapItems(supabase, userId, roadmapIds),
      fetchApplicationHistory(supabase, applications),
      fetchJobsForApplications(supabase, applications),
    ]);

    if ("error" in applicationHistory) {
      return jsonError(applicationHistory.error, 500);
    }

    const completedTaskDates = completedTasks.map((task) =>
      nullableString(task.completed_at),
    );
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const tasksCompletedThisWeek = completedTaskDates.filter((value) => {
      if (!value) {
        return false;
      }

      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date >= weekStart;
    }).length;
    const roadmapProgress = averageProgress(roadmaps);
    const pipeline = pipelineCounts(applications);
    const response: DashboardMetricsResponse = {
      metrics: {
        activeApplications: applications.filter((application) =>
          ["applied", "interviewing"].includes(stringValue(application.status)),
        ).length,
        jobsApplied: applications.filter(
          (application) => stringValue(application.status) === "applied",
        ).length,
        roadmapItemsDone: roadmapItems.items.length,
        roadmapProgress,
        tasksCompletedThisWeek,
        weeklyStreak: calculateWeeklyStreak(completedTaskDates),
      },
      pipeline,
      recentActivity: buildRecentActivity({
        applications,
        applicationHistory: applicationHistory.items,
        completedTasks,
        jobsById,
        roadmapItems: roadmapItems.items,
      }),
      upcomingEvents: asRows(upcomingEventsResult.data).map(normalizeEvent),
    };

    return Response.json(response);
  } catch {
    return jsonError("Could not load dashboard data.", 500);
  }
}

async function fetchJobsForApplications(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applications: DbRow[],
) {
  const jobIds = applications
    .map((application) => stringValue(application.job_id))
    .filter(Boolean);

  if (jobIds.length === 0) {
    return new Map<string, DbRow>();
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company")
    .in("id", Array.from(new Set(jobIds)));

  if (error) {
    return new Map<string, DbRow>();
  }

  return new Map(asRows(data).map((job) => [stringValue(job.id), job]));
}

async function fetchRoadmapItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  roadmapIds: string[],
): Promise<{ items: DbRow[] }> {
  if (roadmapIds.length === 0) {
    return { items: [] };
  }

  const { data, error } = await supabase
    .from("roadmap_items")
    .select("id, title, roadmap_id, status, completed_at")
    .eq("user_id", userId)
    .eq("status", "done")
    .in("roadmap_id", roadmapIds)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error) {
    return { items: [] };
  }

  return { items: asRows(data) };
}

async function fetchApplicationHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applications: DbRow[],
): Promise<{ items: DbRow[] } | { error: string }> {
  const applicationIds = applications
    .map((application) => stringValue(application.id))
    .filter(Boolean);

  if (applicationIds.length === 0) {
    return { items: [] };
  }

  const { data, error } = await supabase
    .from("application_history")
    .select("id, application_id, old_status, new_status, changed_at")
    .in("application_id", applicationIds)
    .order("changed_at", { ascending: false })
    .limit(5);

  if (error) {
    return { error: error.message };
  }

  return { items: asRows(data) };
}

function pipelineCounts(applications: DbRow[]) {
  return PIPELINE_STATUSES.map((status) => ({
    ...status,
    count: applications.filter(
      (application) => stringValue(application.status) === status.status,
    ).length,
  }));
}

function averageProgress(roadmaps: DbRow[]) {
  if (roadmaps.length === 0) {
    return 0;
  }

  const total = roadmaps.reduce((sum, roadmap) => {
    const progress = Number(roadmap.progress_percent ?? 0);
    return sum + (Number.isFinite(progress) ? progress : 0);
  }, 0);

  return Math.round(total / roadmaps.length);
}

function buildRecentActivity({
  applications,
  applicationHistory,
  completedTasks,
  jobsById,
  roadmapItems,
}: {
  applications: DbRow[];
  applicationHistory: DbRow[];
  completedTasks: DbRow[];
  jobsById: Map<string, DbRow>;
  roadmapItems: DbRow[];
}) {
  const applicationMap = new Map(
    applications.map((application) => [stringValue(application.id), application]),
  );
  const activity: RecentActivityItem[] = [
    ...applicationHistory.map((history) => {
      const application = applicationMap.get(stringValue(history.application_id));
      const title = application
        ? applicationTitle(application, jobsById)
        : "Application status changed";
      const oldStatus = statusLabel(nullableString(history.old_status));
      const newStatus = statusLabel(stringValue(history.new_status));

      return {
        description: oldStatus
          ? `Moved from ${oldStatus} to ${newStatus}`
          : `Moved to ${newStatus}`,
        id: `application-${stringValue(history.id)}`,
        timestamp: stringValue(history.changed_at),
        title,
        type: "application" as const,
      };
    }),
    ...completedTasks.slice(0, 3).map((task) => ({
      description: "Completed task",
      id: `task-${stringValue(task.id)}`,
      timestamp: stringValue(task.completed_at),
      title: stringValue(task.title) || "Untitled task",
      type: "task" as const,
    })),
    ...roadmapItems.slice(0, 3).map((item) => ({
      description: "Completed roadmap item",
      id: `roadmap-${stringValue(item.id)}`,
      timestamp: stringValue(item.completed_at),
      title: stringValue(item.title) || "Untitled roadmap item",
      type: "roadmap" as const,
    })),
  ];

  return activity
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

function normalizeEvent(row: DbRow): UpcomingDashboardEvent {
  return {
    eventType: stringValue(row.event_type) || "custom",
    id: stringValue(row.id),
    startTime: stringValue(row.start_time),
    title: stringValue(row.title) || "Untitled event",
  };
}

function applicationTitle(application: DbRow, jobsById: Map<string, DbRow>) {
  const manualTitle = nullableString(application.manual_job_title);
  const manualCompany = nullableString(application.manual_company);
  const job = jobsById.get(stringValue(application.job_id));
  const jobTitle = nullableString(job?.title);
  const jobCompany = nullableString(job?.company);
  const title = manualTitle || jobTitle;
  const company = manualCompany || jobCompany;

  if (title && company) {
    return `${title} at ${company}`;
  }

  return title || company || "Application status changed";
}

function statusLabel(value: string | null) {
  if (!value) {
    return null;
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asRows(value: unknown): DbRow[] {
  return Array.isArray(value) ? (value as DbRow[]) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function jsonError(message: string, status: number) {
  return Response.json({ detail: message }, { status });
}
