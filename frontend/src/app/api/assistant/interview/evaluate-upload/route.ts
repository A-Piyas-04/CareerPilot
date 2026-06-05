import { NextRequest } from "next/server";

import { getModeFromContext } from "@/lib/assistant/interview/context";
import { findCodingProblem } from "@/lib/assistant/interview/problemBank";
import { createGeminiMultimodalText, createGeminiText, GeminiApiError } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

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
    const conversationId = stringField(form, "conversationId");
    const problemId = stringField(form, "problemId");
    const transcriptionOverride = stringField(form, "transcriptionOverride");
    const file = form.get("file");

    if (!conversationId || !isUuid(conversationId)) {
      return jsonError("Invalid conversationId", 400);
    }

    const problem = findCodingProblem(problemId);
    if (!problem) {
      return jsonError("Choose an active coding problem before uploading.", 400);
    }

    if (!transcriptionOverride && !(file instanceof File)) {
      return jsonError("Upload an image or PDF solution first.", 400);
    }

    if (file instanceof File) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return jsonError("Supported files are PNG, JPG, JPEG, WEBP, and PDF.", 400);
      }

      if (file.size > MAX_FILE_BYTES) {
        return jsonError("File must be 8 MB or smaller.", 400);
      }
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError("User not authenticated", 401);
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("assistant_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (conversationError || !conversation) {
      return jsonError("Conversation not found", 404);
    }

    if (getModeFromContext(conversation.context) !== "interview_prep") {
      return jsonError("Uploads are available only in Interview Prep mode.", 400);
    }

    const prompt = buildUploadEvaluationPrompt(problem);
    const parsed = transcriptionOverride
      ? await evaluateTranscribedCode({
          code: transcriptionOverride,
          problemPrompt: prompt,
        })
      : await transcribeAndEvaluateFile({
          file: file as File,
          problemPrompt: prompt,
        });

    const now = new Date().toISOString();
    const uploadLabel =
      file instanceof File
        ? `Uploaded handwritten solution: ${file.name}`
        : "Submitted corrected handwritten transcription";

    const { error: userMessageError } = await supabase
      .from("assistant_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: uploadLabel,
        metadata: {
          interview: {
            action: "evaluate_upload",
            file_name: file instanceof File ? file.name : null,
            problem_id: problem.id,
            problem_title: problem.title,
          },
        },
      });

    if (userMessageError) {
      return jsonError(userMessageError.message, 500);
    }

    const content = formatUploadFeedback(parsed);
    const { data: assistantMessage, error: assistantMessageError } =
      await supabase
        .from("assistant_messages")
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content,
          metadata: {
            assistant_mode: "interview_prep",
            interview: {
              action: "evaluate_upload",
              feedback: parsed.feedback,
              model: parsed.model,
              problem_id: problem.id,
              problem_title: problem.title,
              transcription: parsed.transcription,
              transcription_confidence: parsed.transcriptionConfidence,
            },
          },
        })
        .select("*")
        .single();

    if (assistantMessageError) {
      return jsonError(assistantMessageError.message, 500);
    }

    await supabase
      .from("assistant_conversations")
      .update({ updated_at: now })
      .eq("id", conversationId)
      .eq("user_id", user.id);

    return Response.json({
      feedback: parsed.feedback,
      message: assistantMessage,
      transcription: parsed.transcription,
      transcriptionConfidence: parsed.transcriptionConfidence,
    });
  } catch (error) {
    if (error instanceof GeminiApiError) {
      return jsonError(geminiFriendlyError(error), error.status);
    }

    return jsonError(
      error instanceof Error
        ? error.message
        : "Could not evaluate the uploaded solution.",
      500,
    );
  }
}

async function transcribeAndEvaluateFile({
  file,
  problemPrompt,
}: {
  file: File;
  problemPrompt: string;
}) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await createGeminiMultimodalText({
    fileBase64: buffer.toString("base64"),
    maxOutputTokens: 1600,
    mimeType: file.type,
    prompt: `${problemPrompt}

The uploaded file contains a handwritten or scanned coding answer.
Return JSON only:
{
  "transcription": "code text or explanation you can read",
  "transcriptionConfidence": "high" | "medium" | "low",
  "feedback": "markdown feedback using the required interview feedback format"
}

If the image/PDF is unreadable, set transcriptionConfidence to "low" and explain what needs to be re-uploaded.`,
  });

  return parseUploadEvaluationJson(result.text, result.model);
}

async function evaluateTranscribedCode({
  code,
  problemPrompt,
}: {
  code: string;
  problemPrompt: string;
}) {
  const text = await createGeminiText({
    maxOutputTokens: 1400,
    model: "gemini-2.5-flash",
    prompt: `${problemPrompt}

The user corrected the OCR transcription. Evaluate this answer:

${code}

Return JSON only:
{
  "transcription": "the submitted code",
  "transcriptionConfidence": "high",
  "feedback": "markdown feedback using the required interview feedback format"
}`,
    temperature: 0.2,
  });

  return parseUploadEvaluationJson(text, "gemini-text");
}

function buildUploadEvaluationPrompt(problem: NonNullable<ReturnType<typeof findCodingProblem>>) {
  return `You are CareerPilot Interview Prep. Evaluate a handwritten coding answer.

Coding Problem:
ID: ${problem.id}
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Topics: ${problem.tags.join(", ")}
Prompt: ${problem.prompt}
Expected approach: ${problem.expectedApproach}
Important edge cases: ${problem.edgeCases.join(", ")}

Rules:
- Do not execute code.
- Evaluate the algorithm idea, correctness, complexity, edge cases, and readability.
- Distinguish OCR/transcription uncertainty from actual code mistakes.
- Do not copy external coding platform wording or claim this came from a specific site.
- Keep feedback practical and interview-focused.`;
}

function parseUploadEvaluationJson(raw: string, model: string): {
  feedback: string;
  model: string;
  transcription: string;
  transcriptionConfidence: "high" | "medium" | "low";
} {
  const parsed = JSON.parse(stripCodeFence(raw)) as {
    feedback?: unknown;
    transcription?: unknown;
    transcriptionConfidence?: unknown;
  };

  return {
    feedback:
      typeof parsed.feedback === "string" && parsed.feedback.trim()
        ? parsed.feedback.trim()
        : "I could not evaluate the solution clearly. Please upload a clearer image or paste the code.",
    model,
    transcription:
      typeof parsed.transcription === "string" ? parsed.transcription.trim() : "",
    transcriptionConfidence:
      parsed.transcriptionConfidence === "high" ||
      parsed.transcriptionConfidence === "medium" ||
      parsed.transcriptionConfidence === "low"
        ? parsed.transcriptionConfidence
        : "medium",
  };
}

function formatUploadFeedback({
  feedback,
  transcription,
  transcriptionConfidence,
}: {
  feedback: string;
  transcription: string;
  transcriptionConfidence: "high" | "medium" | "low";
}) {
  return `## Handwritten Code Review

**Transcription confidence:** ${transcriptionConfidence}

### Extracted Code
\`\`\`
${transcription || "No readable code was extracted."}
\`\`\`

${feedback}`;
}

function stripCodeFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function stringField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function geminiFriendlyError(error: GeminiApiError) {
  if (error.status === 429 || error.status === 403) {
    return "Gemini is currently quota-limited. Please try the upload evaluation again later.";
  }

  return "Could not evaluate the uploaded solution right now. Please try again.";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(
    value,
  );
}

function jsonError(message: string, status: number) {
  return Response.json({ detail: message }, { status });
}
