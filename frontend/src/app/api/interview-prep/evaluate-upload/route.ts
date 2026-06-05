import { NextRequest } from "next/server";

import { GeminiApiError } from "@/lib/gemini";
import {
  evaluateInterviewUpload,
  getInterviewPrepAuth,
  InterviewPrepHttpError,
  jsonError,
  loadOwnedInterviewSession,
  normalizeSetup,
} from "@/lib/interview-prep/server";
import type { InterviewPrepQuestion } from "@/lib/interview-prep/types";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const setup = normalizeSetup(jsonField(form, "setup"));
    const question = normalizeQuestion(jsonField(form, "question"));
    const sessionId = stringField(form, "sessionId");
    const questionIndex = Math.max(0, Math.round(Number(stringField(form, "questionIndex")) || 0));
    const elapsedSeconds = Math.max(0, Math.round(Number(stringField(form, "elapsedSeconds")) || 0));
    const file = form.get("file");

    if (!(file instanceof File)) {
      return jsonError("Upload an image or PDF solution.", 400);
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return jsonError("Supported files are PNG, JPG, JPEG, WEBP, and PDF.", 400);
    }

    if (file.size > MAX_FILE_BYTES) {
      return jsonError("File must be 8 MB or smaller.", 400);
    }

    const { accessToken, supabase, user } = await getInterviewPrepAuth();
    const result = await evaluateInterviewUpload({
      accessToken,
      file,
      question,
      setup,
      userId: user.id,
    });

    if (sessionId) {
      await loadOwnedInterviewSession({ sessionId, supabase, userId: user.id });
      const answer = `Uploaded handwritten solution.\n\nTranscription confidence: ${result.transcriptionConfidence}\n\n${result.transcription}`;
      const { error: attemptError } = await supabase
        .from("interview_attempts")
        .update({
          answer,
          completed_at: new Date().toISOString(),
          elapsed_seconds: elapsedSeconds,
          evaluation: result.evaluation,
          score: result.evaluation.score,
          seconds_left: 0,
          skipped: false,
          status: "completed",
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

      await supabase
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
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof InterviewPrepHttpError || error instanceof GeminiApiError) {
      return jsonError(error.message, error.status);
    }

    return jsonError(
      error instanceof Error
        ? error.message
        : "Could not evaluate uploaded solution.",
      500,
    );
  }
}

function jsonField(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function stringField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
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
