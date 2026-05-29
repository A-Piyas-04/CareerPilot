import { NextRequest } from "next/server";

import {
  fetchRoadmapItemForUser,
  getAuthenticatedRoadmapUser,
  isUuid,
  jsonError,
  RoadmapHttpError,
} from "@/lib/roadmap/server";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { itemId } = await context.params;

    if (!isUuid(itemId)) {
      return jsonError("Invalid roadmap item id.", 400);
    }

    const body = (await request.json()) as {
      endTime?: unknown;
      startTime?: unknown;
    };
    const startTime = typeof body.startTime === "string" ? body.startTime : "";
    const endTime = typeof body.endTime === "string" ? body.endTime : "";

    if (!startTime || Number.isNaN(new Date(startTime).getTime())) {
      return jsonError("A valid start time is required.", 400);
    }

    if (endTime && Number.isNaN(new Date(endTime).getTime())) {
      return jsonError("End time must be valid when provided.", 400);
    }

    const { supabase, user } = await getAuthenticatedRoadmapUser();
    const item = await fetchRoadmapItemForUser(supabase, itemId, user.id);
    const { data: task } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("roadmap_item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert({
        application_id: null,
        description: item.description,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        event_type: "study",
        reminder_time: null,
        start_time: new Date(startTime).toISOString(),
        task_id: task?.id ?? null,
        title: item.title,
        user_id: user.id,
      })
      .select("id, title, event_type, start_time")
      .single();

    if (error || !event) {
      return jsonError(error?.message ?? "Could not add calendar event.", 500);
    }

    return Response.json({ event });
  } catch (error) {
    if (error instanceof RoadmapHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not add calendar event.", 500);
  }
}
