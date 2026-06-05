import { NextRequest } from "next/server";

import { GeminiApiError } from "@/lib/gemini";
import {
  evaluateInterviewAnswer,
  getInterviewPrepAuth,
  InterviewPrepHttpError,
  jsonError,
  loadOwnedInterviewSession,
  normalizeSetup,
} from "@/lib/interview-prep/server";
import type { InterviewPrepQuestion } from "@/lib/interview-prep/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      answer?: unknown;
      elapsedSeconds?: unknown;
      question?: unknown;
      questionIndex?: unknown;
      sessionId?: unknown;
      setup?: unknown;
      skipped?: unknown;
    };
    const setup = normalizeSetup(body.setup);
    const question = normalizeQuestion(body.question);
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const skipped = body.skipped === true;
    const elapsedSeconds = Math.max(0, Math.round(Number(body.elapsedSeconds) || 0));

    if (!skipped && !answer) {
      return jsonError("Answer cannot be empty.", 400);
    }

    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const { accessToken, supabase, user } = await getInterviewPrepAuth();
    const evaluation = await evaluateInterviewAnswer({
      accessToken,
      answer,
      elapsedSeconds,
      question,
      setup,
      skipped,
      userId: user.id,
    });

    if (sessionId) {
      await loadOwnedInterviewSession({ sessionId, supabase, userId: user.id });
      const questionIndex = Math.max(0, Math.round(Number(body.questionIndex) || 0));
      const { error: attemptError } = await supabase
        .from("interview_attempts")
        .update({
          answer: skipped ? "" : answer,
          completed_at: new Date().toISOString(),
          elapsed_seconds: elapsedSeconds,
          evaluation,
          score: evaluation.score,
          seconds_left: 0,
          skipped,
          status: skipped ? "skipped" : "completed",
        })
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("question_index", questionIndex);

      if (attemptError) {
        return jsonError(attemptError.message, 500);
      }

      const { data: attempts, error: attemptsError } = await supabase
        .from("interview_attempts")
        .select("score, status")
        .eq("session_id", sessionId)
        .eq("user_id", user.id);

      if (attemptsError) {
        return jsonError(attemptsError.message, 500);
      }

      const completedAttempts = (attempts ?? []).filter(
        (attempt) => attempt.status === "completed" || attempt.status === "skipped",
      );
      const averageScore = completedAttempts.length
        ? Math.round(
            completedAttempts.reduce(
              (sum, attempt) => sum + Number(attempt.score ?? 0),
              0,
            ) / completedAttempts.length,
          )
        : 0;
      const isComplete = completedAttempts.length >= setup.questionCount;
      const { error: sessionError } = await supabase
        .from("interview_sessions")
        .update({
          average_score: averageScore,
          completed_at: isComplete ? new Date().toISOString() : null,
          current_index: Math.min(questionIndex + 1, setup.questionCount),
          seconds_left: null,
          status: isComplete ? "completed" : "in_progress",
        })
        .eq("id", sessionId)
        .eq("user_id", user.id);

      if (sessionError) {
        return jsonError(sessionError.message, 500);
      }
    }

    return Response.json({ evaluation });
  } catch (error) {
    if (error instanceof InterviewPrepHttpError || error instanceof GeminiApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError(
      error instanceof Error
        ? error.message
        : "Could not evaluate interview answer.",
      500,
    );
  }
}

function normalizeQuestion(value: unknown): InterviewPrepQuestion {
  if (!value || typeof value !== "object") {
    throw new InterviewPrepHttpError("Invalid question.", 400);
  }

  const raw = value as Record<string, unknown>;
  if (
    typeof raw.id !== "string" ||
    typeof raw.prompt !== "string" ||
    typeof raw.title !== "string" ||
    (raw.type !== "behavioral" && raw.type !== "technical" && raw.type !== "coding")
  ) {
    throw new InterviewPrepHttpError("Invalid question.", 400);
  }

  return raw as InterviewPrepQuestion;
}
