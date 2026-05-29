import {
  differenceInCalendarDays,
  endOfDay,
  startOfDay,
  startOfWeek,
  addDays,
} from "date-fns";

import { GeminiApiError, GEMINI_MODEL, createGeminiText } from "@/lib/gemini";
import { buildNudgePrompt, NUDGE_SYSTEM_PROMPT } from "@/lib/reminders/prompts";
import { parseNudgesJson } from "@/lib/reminders/parser";
import {
  NUDGE_GENERATION_FAILED_MESSAGE,
  QUOTA_EXCEEDED_MESSAGE,
  type NudgeActivitySummary,
} from "@/lib/reminders/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DbRow = Record<string, unknown>;

export async function POST(request: Request) {
  try {
    await request.json().catch(() => ({}));
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError({ error: "nudge_generation_failed", message: "User not authenticated" }, 401);
    }

    const summary = await collectActivitySummary(supabase, user.id);
    const rawResponse = await createGeminiText({
      maxOutputTokens: 900,
      model: GEMINI_MODEL,
      prompt: buildNudgePrompt(summary),
      systemPrompt: NUDGE_SYSTEM_PROMPT,
      temperature: 0.25,
    });
    const nudges = parseNudgesJson(rawResponse);

    return Response.json({
      cached: false,
      generatedAt: new Date().toISOString(),
      nudges,
    });
  } catch (error) {
    if (isQuotaError(error)) {
      return jsonError(
        {
          error: "quota_exceeded",
          message: QUOTA_EXCEEDED_MESSAGE,
        },
        429,
      );
    }

    return jsonError(
      {
        error: "nudge_generation_failed",
        message: NUDGE_GENERATION_FAILED_MESSAGE,
      },
      error instanceof GeminiApiError ? error.status : 500,
    );
  }
}

async function collectActivitySummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<NudgeActivitySummary> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const nextWeekEnd = addDays(now, 7);
  const [
    applicationsResult,
    tasksResult,
    eventsResult,
    roadmapsResult,
    goalsResult,
  ] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, applied_at, created_at")
      .eq("user_id", userId),
    supabase
      .from("tasks")
      .select("id, status, due_date, completed_at")
      .eq("user_id", userId),
    supabase
      .from("calendar_events")
      .select("id, title, event_type, start_time")
      .eq("user_id", userId)
      .gte("start_time", now.toISOString())
      .lte("start_time", nextWeekEnd.toISOString())
      .order("start_time", { ascending: true })
      .limit(8),
    supabase
      .from("roadmaps")
      .select("id, progress_percent")
      .eq("user_id", userId),
    supabase
      .from("goals")
      .select("id, status, target_date")
      .eq("user_id", userId),
  ]);

  const firstCoreError =
    applicationsResult.error || tasksResult.error || eventsResult.error;

  if (firstCoreError) {
    throw new Error(firstCoreError.message);
  }

  const applications = rows(applicationsResult.data);
  const tasks = rows(tasksResult.data);
  const events = rows(eventsResult.data);
  const roadmaps = roadmapsResult.error ? null : rows(roadmapsResult.data);
  const goals = goalsResult.error ? null : rows(goalsResult.data);
  const roadmapIds =
    roadmaps?.map((roadmap) => stringValue(roadmap.id)).filter(Boolean) ?? [];
  const roadmapItems = await fetchRoadmapItems(supabase, userId, roadmapIds);
  const appliedDates = applications
    .map((application) => nullableString(application.applied_at))
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return {
    activeApplications: applications.filter((application) =>
      ["applied", "interviewing"].includes(stringValue(application.status)),
    ).length,
    activeGoals: goals
      ? goals.filter((goal) => stringValue(goal.status) === "active").length
      : null,
    daysSinceLastApplication:
      appliedDates.length > 0
        ? differenceInCalendarDays(now, appliedDates[0])
        : null,
    goalsNearTargetDate: goals
      ? goals.filter((goal) => {
          const targetDate = nullableString(goal.target_date);
          if (!targetDate || stringValue(goal.status) !== "active") {
            return false;
          }
          const date = new Date(`${targetDate}T00:00:00`);
          return (
            !Number.isNaN(date.getTime()) &&
            date >= todayStart &&
            date <= nextWeekEnd
          );
        }).length
      : null,
    lowProgressRoadmaps: roadmaps
      ? roadmaps.filter((roadmap) => numberValue(roadmap.progress_percent) < 35)
          .length
      : null,
    openRoadmapItems: roadmapItems
      ? roadmapItems.filter((item) => stringValue(item.status) !== "done").length
      : null,
    overdueTasks: tasks.filter((task) => {
      const dueDate = nullableString(task.due_date);
      return Boolean(
        dueDate &&
          stringValue(task.status) !== "done" &&
          new Date(`${dueDate}T00:00:00`) < todayStart,
      );
    }).length,
    recentlyCompletedRoadmapItems: roadmapItems
      ? roadmapItems.filter((item) => {
          const completedAt = nullableString(item.completed_at);
          return Boolean(
            completedAt &&
              new Date(completedAt) >= weekStart &&
              stringValue(item.status) === "done",
          );
        }).length
      : null,
    roadmapProgressAverage: roadmaps ? averageProgress(roadmaps) : null,
    savedApplications: applications.filter(
      (application) => stringValue(application.status) === "saved",
    ).length,
    tasksCompletedThisWeek: tasks.filter((task) => {
      const completedAt = nullableString(task.completed_at);
      return Boolean(
        completedAt &&
          stringValue(task.status) === "done" &&
          new Date(completedAt) >= weekStart,
      );
    }).length,
    tasksDueToday: tasks.filter((task) => {
      const dueDate = nullableString(task.due_date);
      if (!dueDate || stringValue(task.status) === "done") {
        return false;
      }
      const date = new Date(`${dueDate}T00:00:00`);
      return date >= todayStart && date <= todayEnd;
    }).length,
    totalApplications: applications.length,
    upcomingEventsNext7Days: events.map((event) => ({
      eventType: stringValue(event.event_type) || "custom",
      startTime: stringValue(event.start_time),
      title: stringValue(event.title) || "Untitled event",
    })),
  };
}

async function fetchRoadmapItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  roadmapIds: string[],
) {
  if (roadmapIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("roadmap_items")
    .select("id, status, due_date, completed_at")
    .eq("user_id", userId)
    .in("roadmap_id", roadmapIds);

  return error ? null : rows(data);
}

function averageProgress(roadmaps: DbRow[]) {
  if (roadmaps.length === 0) {
    return 0;
  }
  const total = roadmaps.reduce(
    (sum, roadmap) => sum + numberValue(roadmap.progress_percent),
    0,
  );
  return Math.round(total / roadmaps.length);
}

function isQuotaError(error: unknown) {
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
    type?: unknown;
  };
  const message = String(candidate?.message ?? "").toLowerCase();
  const code = String(candidate?.code ?? "").toLowerCase();
  const type = String(candidate?.type ?? "").toLowerCase();

  return (
    candidate?.status === 429 ||
    code.includes("insufficient_quota") ||
    type.includes("insufficient_quota") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("billing")
  );
}

function rows(value: unknown): DbRow[] {
  return Array.isArray(value) ? (value as DbRow[]) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function numberValue(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function jsonError(payload: Record<string, unknown>, status: number) {
  return Response.json(payload, { status });
}
