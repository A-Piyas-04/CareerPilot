import { NextRequest } from "next/server";

import { GeminiApiError } from "@/lib/gemini";
import {
  generateInterviewQuestion,
  getInterviewPrepAuth,
  InterviewPrepHttpError,
  jsonError,
  loadOwnedInterviewSession,
  normalizeAttempt,
  normalizeSetup,
} from "@/lib/interview-prep/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      answeredQuestionIds?: unknown;
      questionIndex?: unknown;
      sessionId?: unknown;
      setup?: unknown;
    };
    const setup = normalizeSetup(body.setup);
    const questionIndex = Number(body.questionIndex);
    const answeredQuestionIds = Array.isArray(body.answeredQuestionIds)
      ? body.answeredQuestionIds.filter(
          (id): id is string => typeof id === "string",
        )
      : [];

    if (!Number.isInteger(questionIndex) || questionIndex < 0) {
      return jsonError("Invalid question index.", 400);
    }

    if (questionIndex >= setup.questionCount) {
      return jsonError("Interview session is already complete.", 400);
    }

    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const { accessToken, supabase, user } = await getInterviewPrepAuth();
    if (sessionId) {
      await loadOwnedInterviewSession({ sessionId, supabase, userId: user.id });
      const { data: existingAttempt, error: existingError } = await supabase
        .from("interview_attempts")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("question_index", questionIndex)
        .maybeSingle();

      if (existingError) {
        return jsonError(existingError.message, 500);
      }

      if (existingAttempt) {
        const attempt = normalizeAttempt(existingAttempt as Record<string, unknown>);
        return Response.json({ attempt, question: attempt.question });
      }
    }

    const question = await generateInterviewQuestion({
      accessToken,
      answeredQuestionIds,
      questionIndex,
      setup,
      userId: user.id,
    });

    if (sessionId) {
      const { data: attempt, error: attemptError } = await supabase
        .from("interview_attempts")
        .insert({
          question,
          question_index: questionIndex,
          seconds_left: question.timeLimitSeconds,
          session_id: sessionId,
          status: "answering",
          user_id: user.id,
        })
        .select("*")
        .single();

      if (attemptError || !attempt) {
        return jsonError(attemptError?.message ?? "Could not save question.", 500);
      }

      await supabase
        .from("interview_sessions")
        .update({
          current_index: questionIndex,
          last_question_started_at: new Date().toISOString(),
          seconds_left: question.timeLimitSeconds,
        })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      return Response.json({
        attempt: normalizeAttempt(attempt as Record<string, unknown>),
        question,
      });
    }

    return Response.json({ question });
  } catch (error) {
    if (error instanceof InterviewPrepHttpError || error instanceof GeminiApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError(
      error instanceof Error
        ? error.message
        : "Could not generate interview question.",
      500,
    );
  }
}
