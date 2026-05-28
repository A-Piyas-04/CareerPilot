import { NextRequest } from "next/server";

import {
  fetchRoadmapItemForUser,
  getAuthenticatedRoadmapUser,
  isUuid,
  jsonError,
  normalizeRoadmapItem,
  recalculateRoadmapProgress,
  RoadmapHttpError,
} from "@/lib/roadmap/server";
import type { RoadmapItemStatus } from "@/lib/roadmap/types";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

const VALID_STATUSES: RoadmapItemStatus[] = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { itemId } = await context.params;

    if (!isUuid(itemId)) {
      return jsonError("Invalid roadmap item id.", 400);
    }

    const body = (await request.json()) as { status?: unknown };
    const status = typeof body.status === "string" ? body.status : "";

    if (!VALID_STATUSES.includes(status as RoadmapItemStatus)) {
      return jsonError("Invalid item status.", 400);
    }

    const { supabase, user } = await getAuthenticatedRoadmapUser();
    const item = await fetchRoadmapItemForUser(supabase, itemId, user.id);
    const completedAt = status === "done" ? new Date().toISOString() : null;
    const { data: updatedItem, error } = await supabase
      .from("roadmap_items")
      .update({
        completed_at: completedAt,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !updatedItem) {
      return jsonError(error?.message ?? "Could not update item.", 500);
    }

    const progress = await recalculateRoadmapProgress(
      supabase,
      item.roadmap_id,
      user.id,
    );

    return Response.json({
      item: normalizeRoadmapItem(updatedItem),
      progress,
    });
  } catch (error) {
    if (error instanceof RoadmapHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not update roadmap item.", 500);
  }
}
