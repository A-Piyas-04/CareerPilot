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

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;

    if (!isUuid(itemId)) {
      return jsonError("Invalid roadmap item id.", 400);
    }

    const { supabase, user } = await getAuthenticatedRoadmapUser();
    const item = await fetchRoadmapItemForUser(supabase, itemId, user.id);
    const { data: existingTask, error: existingError } = await supabase
      .from("tasks")
      .select("id, roadmap_item_id, title, status")
      .eq("user_id", user.id)
      .eq("roadmap_item_id", itemId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return jsonError(existingError.message, 500);
    }

    if (existingTask) {
      return Response.json({ created: false, task: existingTask });
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        description: item.description,
        due_date: item.due_date,
        priority: 2,
        roadmap_item_id: item.id,
        status: "todo",
        title: item.title,
        user_id: user.id,
      })
      .select("id, roadmap_item_id, title, status")
      .single();

    if (error || !task) {
      return jsonError(error?.message ?? "Could not create task.", 500);
    }

    return Response.json({ created: true, task });
  } catch (error) {
    if (error instanceof RoadmapHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not create task.", 500);
  }
}
