import { NextRequest } from "next/server";

import { GeminiApiError, GEMINI_MODEL, createGeminiText } from "@/lib/gemini";
import { parseRoadmapJson } from "@/lib/roadmap/parseRoadmapJson";
import {
  getAuthenticatedRoadmapUser,
  jsonError,
  loadRoadmapResumeContext,
  normalizeRoadmap,
  normalizeRoadmapItem,
  RoadmapHttpError,
} from "@/lib/roadmap/server";
import { buildRoadmapPrompt, ROADMAP_SYSTEM_PROMPT } from "@/lib/roadmap/roadmapPrompts";
import type { GenerateRoadmapRequest } from "@/lib/roadmap/types";

export const runtime = "nodejs";

const VALID_DURATIONS = [4, 8, 12] as const;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<GenerateRoadmapRequest>;
    const targetRole =
      typeof body.targetRole === "string" ? body.targetRole.trim() : "";
    const durationWeeks = Number(body.durationWeeks);
    const jobDescription =
      typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

    if (!targetRole) {
      return jsonError("Target role is required.", 400);
    }

    if (!VALID_DURATIONS.includes(durationWeeks as 4 | 8 | 12)) {
      return jsonError("Duration must be 4, 8, or 12 weeks.", 400);
    }

    const { supabase, user } = await getAuthenticatedRoadmapUser();
    const [{ data: profile }, resumeContext] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, target_role, location, bio")
        .eq("id", user.id)
        .maybeSingle(),
      loadRoadmapResumeContext(supabase, user.id),
    ]);
    const prompt = buildRoadmapPrompt({
      durationWeeks,
      jobDescription,
      profile,
      resumeContext: resumeContext.text,
      targetRole,
    });
    const rawRoadmap = await createGeminiText({
      maxOutputTokens: Math.max(2500, durationWeeks * 520),
      model: GEMINI_MODEL,
      prompt,
      systemPrompt: ROADMAP_SYSTEM_PROMPT,
      temperature: 0.25,
    });
    const generated = parseRoadmapJson(rawRoadmap, durationWeeks);
    const now = new Date().toISOString();
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .insert({
        duration_weeks: durationWeeks,
        overview: generated.overview,
        progress_percent: 0,
        resume_id: resumeContext.resumeId,
        target_role: targetRole,
        updated_at: now,
        user_id: user.id,
      })
      .select("*")
      .single();

    if (roadmapError || !roadmap) {
      return jsonError(roadmapError?.message ?? "Could not save roadmap.", 500);
    }

    const roadmapId = String(roadmap.id);
    const { data: items, error: itemError } = await supabase
      .from("roadmap_items")
      .insert(
        generated.items.map((item) => ({
          description: item.description,
          resources: item.resources,
          roadmap_id: roadmapId,
          status: "todo",
          title: item.title,
          user_id: user.id,
          week_number: item.week_number,
        })),
      )
      .select("*");

    if (itemError || !items) {
      await supabase
        .from("roadmaps")
        .delete()
        .eq("id", roadmapId)
        .eq("user_id", user.id);

      return jsonError(itemError?.message ?? "Could not save roadmap items.", 500);
    }

    return Response.json({
      items: items.map(normalizeRoadmapItem),
      roadmap: normalizeRoadmap(roadmap),
      roadmapId,
    });
  } catch (error) {
    if (error instanceof RoadmapHttpError || error instanceof GeminiApiError) {
      return jsonError(error.message, error.status);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Could not generate roadmap. Please try again.";
    return jsonError(message, 500);
  }
}
