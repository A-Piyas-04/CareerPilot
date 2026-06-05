import { NextRequest } from "next/server";

import {
  getInterviewPrepAuth,
  InterviewPrepHttpError,
  jsonError,
  loadOwnedInterviewSession,
  normalizeSession,
} from "@/lib/interview-prep/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase, user } = await getInterviewPrepAuth();
    const session = await loadOwnedInterviewSession({
      sessionId: id,
      supabase,
      userId: user.id,
    });
    const { data: attempts, error } = await supabase
      .from("interview_attempts")
      .select("*")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .order("question_index", { ascending: true });

    if (error) {
      return jsonError(error.message, 500);
    }

    return Response.json({
      session: normalizeSession(session, (attempts ?? []) as Record<string, unknown>[]),
    });
  } catch (error) {
    if (error instanceof InterviewPrepHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not load interview session.", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      currentIndex?: unknown;
      secondsLeft?: unknown;
      status?: unknown;
    };
    const { supabase, user } = await getInterviewPrepAuth();
    await loadOwnedInterviewSession({ sessionId: id, supabase, userId: user.id });

    const update: Record<string, unknown> = {};
    if (Number.isFinite(Number(body.secondsLeft))) {
      update.seconds_left = Math.max(0, Math.round(Number(body.secondsLeft)));
      update.last_question_started_at = new Date().toISOString();
    }
    if (Number.isInteger(Number(body.currentIndex))) {
      update.current_index = Math.max(0, Math.round(Number(body.currentIndex)));
    }
    if (
      body.status === "in_progress" ||
      body.status === "completed" ||
      body.status === "abandoned"
    ) {
      update.status = body.status;
      if (body.status === "completed") {
        update.completed_at = new Date().toISOString();
      }
    }

    if (Object.keys(update).length === 0) {
      return jsonError("No valid update fields were provided.", 400);
    }

    const { error: sessionError } = await supabase
      .from("interview_sessions")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id);

    if (sessionError) {
      return jsonError(sessionError.message, 500);
    }

    if (Number.isFinite(Number(body.secondsLeft)) && Number.isInteger(Number(body.currentIndex))) {
      await supabase
        .from("interview_attempts")
        .update({ seconds_left: Math.max(0, Math.round(Number(body.secondsLeft))) })
        .eq("session_id", id)
        .eq("user_id", user.id)
        .eq("question_index", Math.max(0, Math.round(Number(body.currentIndex))))
        .eq("status", "answering");
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof InterviewPrepHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not update interview session.", 500);
  }
}
