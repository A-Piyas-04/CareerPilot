import {
  getAuthenticatedRoadmapUser,
  jsonError,
  normalizeRoadmap,
  RoadmapHttpError,
} from "@/lib/roadmap/server";
import type { RoadmapListItem } from "@/lib/roadmap/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedRoadmapUser();
    const { data: roadmaps, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    const roadmapRows = roadmaps ?? [];
    const roadmapIds = roadmapRows
      .map((roadmap) => roadmap.id)
      .filter((id): id is string => typeof id === "string");
    let counts = new Map<string, { item_count: number; completed_count: number }>();

    if (roadmapIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("roadmap_items")
        .select("roadmap_id, status")
        .eq("user_id", user.id)
        .in("roadmap_id", roadmapIds);

      if (itemsError) {
        return jsonError(itemsError.message, 500);
      }

      counts = (items ?? []).reduce((accumulator, item) => {
        if (typeof item.roadmap_id !== "string") {
          return accumulator;
        }

        const current = accumulator.get(item.roadmap_id) ?? {
          completed_count: 0,
          item_count: 0,
        };

        current.item_count += 1;
        if (item.status === "done") {
          current.completed_count += 1;
        }

        accumulator.set(item.roadmap_id, current);
        return accumulator;
      }, new Map<string, { item_count: number; completed_count: number }>());
    }

    const items: RoadmapListItem[] = roadmapRows.map((roadmap) => ({
      ...normalizeRoadmap(roadmap),
      ...(counts.get(String(roadmap.id)) ?? {
        completed_count: 0,
        item_count: 0,
      }),
    }));

    return Response.json({ roadmaps: items });
  } catch (error) {
    if (error instanceof RoadmapHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not load roadmaps.", 500);
  }
}
