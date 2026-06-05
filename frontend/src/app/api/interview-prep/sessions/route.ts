import { NextRequest } from "next/server";

import {
  getInterviewPrepAuth,
  InterviewPrepHttpError,
  jsonError,
  normalizeSession,
  normalizeSetup,
} from "@/lib/interview-prep/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { supabase, user } = await getInterviewPrepAuth();
    const { data: sessions, error } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    const rows = (sessions ?? []) as Record<string, unknown>[];
    return Response.json({
      activeSession:
        rows.find((session) => session.status === "in_progress")
          ? normalizeSession(rows.find((session) => session.status === "in_progress")!)
          : null,
      sessions: rows.map((session) => normalizeSession(session)),
    });
  } catch (error) {
    if (error instanceof InterviewPrepHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not load interview sessions.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { setup?: unknown };
    const setup = normalizeSetup(body.setup);
    const { supabase, user } = await getInterviewPrepAuth();
    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({
        average_score: 0,
        current_index: 0,
        question_count: setup.questionCount,
        setup,
        status: "in_progress",
        user_id: user.id,
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Could not create interview session.", 500);
    }

    return Response.json({ session: normalizeSession(data as Record<string, unknown>) });
  } catch (error) {
    if (error instanceof InterviewPrepHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not create interview session.", 500);
  }
}
