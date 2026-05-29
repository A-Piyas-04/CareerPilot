import { getResumeContext } from "@/lib/assistant/getResumeContext";
import type { Roadmap, RoadmapItem, RoadmapResource } from "@/lib/roadmap/types";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type RoadmapRow = Record<string, unknown>;

export class RoadmapHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RoadmapHttpError";
    this.status = status;
  }
}

export async function getAuthenticatedRoadmapUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new RoadmapHttpError("User not authenticated", 401);
  }

  return { supabase, user };
}

export async function loadRoadmapResumeContext(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, raw_text")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("status", "processed")
    .not("raw_text", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    resume &&
    typeof resume.id === "string" &&
    typeof resume.raw_text === "string" &&
    resume.raw_text.trim()
  ) {
    const { data: chunks } = await supabase
      .from("resume_chunks")
      .select("id")
      .eq("resume_id", resume.id)
      .eq("user_id", userId)
      .limit(20);

    return {
      resumeId: resume.id,
      text: resume.raw_text.slice(0, 6000),
      usedResumeChunks:
        chunks
          ?.map((chunk) => chunk.id)
          .filter((id): id is string => typeof id === "string") ?? [],
    };
  }

  const fallback = await getResumeContext(userId);

  return {
    resumeId: null,
    text: fallback.text,
    usedResumeChunks: fallback.usedResumeChunks,
  };
}

export async function fetchRoadmapDetail(
  supabase: SupabaseServerClient,
  roadmapId: string,
  userId: string,
) {
  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", roadmapId)
    .eq("user_id", userId)
    .single();

  if (roadmapError || !roadmap) {
    throw new RoadmapHttpError("Roadmap not found", 404);
  }

  const { data: items, error: itemsError } = await supabase
    .from("roadmap_items")
    .select("*")
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId)
    .order("week_number", { ascending: true });

  if (itemsError) {
    throw new RoadmapHttpError(itemsError.message, 500);
  }

  return {
    roadmap: normalizeRoadmap(roadmap),
    items: (items ?? []).map(normalizeRoadmapItem),
  };
}

export async function fetchRoadmapItemForUser(
  supabase: SupabaseServerClient,
  itemId: string,
  userId: string,
) {
  const { data: item, error } = await supabase
    .from("roadmap_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (error || !item) {
    throw new RoadmapHttpError("Roadmap item not found", 404);
  }

  return normalizeRoadmapItem(item);
}

export async function recalculateRoadmapProgress(
  supabase: SupabaseServerClient,
  roadmapId: string,
  userId: string,
) {
  const { data: items, error } = await supabase
    .from("roadmap_items")
    .select("status")
    .eq("roadmap_id", roadmapId)
    .eq("user_id", userId);

  if (error) {
    throw new RoadmapHttpError(error.message, 500);
  }

  const total = items?.length ?? 0;
  const done = items?.filter((item) => item.status === "done").length ?? 0;
  const progress = total > 0 ? Number(((done / total) * 100).toFixed(2)) : 0;

  const { error: updateError } = await supabase
    .from("roadmaps")
    .update({
      progress_percent: progress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", roadmapId)
    .eq("user_id", userId);

  if (updateError) {
    throw new RoadmapHttpError(updateError.message, 500);
  }

  return progress;
}

export function normalizeRoadmap(row: RoadmapRow): Roadmap {
  return {
    id: stringValue(row.id),
    user_id: stringValue(row.user_id),
    resume_id: nullableString(row.resume_id),
    target_role: stringValue(row.target_role),
    duration_weeks: numberValue(row.duration_weeks),
    overview: nullableString(row.overview),
    progress_percent: numberValue(row.progress_percent),
    created_at: stringValue(row.created_at),
    updated_at: stringValue(row.updated_at),
  };
}

export function normalizeRoadmapItem(row: RoadmapRow): RoadmapItem {
  return {
    id: stringValue(row.id),
    roadmap_id: stringValue(row.roadmap_id),
    user_id: stringValue(row.user_id),
    week_number: numberValue(row.week_number),
    title: stringValue(row.title),
    description: nullableString(row.description),
    resources: normalizeResources(row.resources),
    status: roadmapStatusValue(row.status),
    due_date: nullableString(row.due_date),
    completed_at: nullableString(row.completed_at),
    created_at: stringValue(row.created_at),
    updated_at: stringValue(row.updated_at),
  };
}

export function jsonError(message: string, status: number) {
  return Response.json({ detail: message }, { status });
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeResources(value: unknown): RoadmapResource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((resource) => {
      if (
        typeof resource !== "object" ||
        resource === null ||
        Array.isArray(resource)
      ) {
        return null;
      }

      const candidate = resource as Record<string, unknown>;
      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
      const url = typeof candidate.url === "string" ? candidate.url.trim() : "";

      if (!name) {
        return null;
      }

      return url ? { name, url } : { name };
    })
    .filter((resource): resource is RoadmapResource => resource !== null);
}

function roadmapStatusValue(value: unknown): RoadmapItem["status"] {
  return value === "in_progress" ||
    value === "done" ||
    value === "cancelled" ||
    value === "todo"
    ? value
    : "todo";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
