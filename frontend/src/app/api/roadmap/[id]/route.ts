import {
  fetchRoadmapDetail,
  getAuthenticatedRoadmapUser,
  isUuid,
  jsonError,
  RoadmapHttpError,
} from "@/lib/roadmap/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isUuid(id)) {
      return jsonError("Invalid roadmap id.", 400);
    }

    const { supabase, user } = await getAuthenticatedRoadmapUser();
    const detail = await fetchRoadmapDetail(supabase, id, user.id);

    return Response.json(detail);
  } catch (error) {
    if (error instanceof RoadmapHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not load roadmap.", 500);
  }
}
