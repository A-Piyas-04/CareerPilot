import { NextRequest } from "next/server";

import { buildSystemPrompt } from "@/lib/assistant/buildSystemPrompt";
import { detectAssistantIntent } from "@/lib/assistant/detectIntent";
import { getResumeContext } from "@/lib/assistant/getResumeContext";
import { buildIntentPrompt } from "@/lib/assistant/intentPrompts";
import { loadConversationMemory } from "@/lib/assistant/loadConversationMemory";
import type { AssistantProfile } from "@/lib/assistant/types";
import {
  createGeminiStream,
  extractGeminiTextFromSsePayload,
  GeminiApiError,
  GEMINI_MODEL,
} from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

const MODEL = GEMINI_MODEL;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      conversationId?: unknown;
      message?: unknown;
    };
    const conversationId =
      typeof body.conversationId === "string" ? body.conversationId : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!conversationId) {
      return jsonError("Missing conversationId", 400);
    }

    if (!isUuid(conversationId)) {
      return jsonError("Invalid conversationId", 400);
    }

    if (!message) {
      return jsonError("Message cannot be empty", 400);
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

    const [profile, resumeContext, memory] = await Promise.all([
      loadProfile(user.id),
      getResumeContext(user.id),
      loadConversationMemory({
        supabase,
        conversationId,
        userId: user.id,
        limit: 12,
      }),
    ]);

    const intentDetection = await detectAssistantIntent(message);
    const intent = intentDetection.intent;
    const baseSystemPrompt = buildSystemPrompt({
      profile,
      resumeContext: resumeContext.text,
    });
    const intentPrompt = buildIntentPrompt(intent, {
      conversationMemory: memory,
      profile,
      resumeContext: resumeContext.text,
      userMessage: message,
    });
    const systemPrompt = `${baseSystemPrompt}\n\n${intentPrompt}`;
    const nextTitle = shouldGenerateTitle(conversation.title)
      ? titleFromMessage(message)
      : conversation.title;
    const now = new Date().toISOString();

    const { error: userMessageError } = await supabase
      .from("assistant_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: message,
        metadata: {},
      });

    if (userMessageError) {
      return jsonError(userMessageError.message, 500);
    }

    const geminiStream = await createGeminiStream({
      currentMessage: message,
      memory,
      systemPrompt,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = geminiStream.getReader();
    let fullAssistantResponse = "";

    return new Response(
      new ReadableStream({
        async start(controller) {
          const enqueueTokenFromLine = (line: string) => {
            const trimmedLine = line.trim();

            if (!trimmedLine.startsWith("data:")) {
              return;
            }

            const payload = trimmedLine.slice("data:".length).trim();

            if (!payload) {
              return;
            }

            try {
              const token = extractGeminiTextFromSsePayload(payload);

              if (!token) {
                return;
              }

              fullAssistantResponse += token;
              controller.enqueue(encoder.encode(token));
            } catch {
              // Ignore malformed keep-alive or partial SSE payloads.
            }
          };

          try {
            let sseBuffer = "";

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              sseBuffer += decoder.decode(value, { stream: true });
              const lines = sseBuffer.split(/\r?\n/);
              sseBuffer = lines.pop() ?? "";

              for (const line of lines) {
                enqueueTokenFromLine(line);
              }
            }

            const tail = decoder.decode();
            if (tail) {
              sseBuffer += tail;
            }

            for (const line of sseBuffer.split(/\r?\n/)) {
              enqueueTokenFromLine(line);
            }

            const finalContent =
              fullAssistantResponse.trim() ||
              "I could not generate a response. Please try again.";

            const { error: assistantMessageError } = await supabase
              .from("assistant_messages")
              .insert({
                conversation_id: conversationId,
                user_id: user.id,
                role: "assistant",
                content: finalContent,
                used_resume_chunks: validUuidArray(resumeContext.usedResumeChunks),
                used_job_id: null,
                metadata: {
                  model: MODEL,
                  streamed: true,
                  intent,
                  intent_confidence: intentDetection.confidence,
                  intent_detection_method: intentDetection.method,
                  intent_reason: intentDetection.reason,
                  matched_pattern: intentDetection.matchedPattern,
                  source: "phase-2.3-benchmark-query-handlers",
                  can_save_roadmap: intent === "roadmap_generation",
                  can_save_cover_letter: intent === "cover_letter",
                  mock_resume_chunk_ids: resumeContext.usedResumeChunks,
                },
              });

            if (assistantMessageError) {
              throw new Error(assistantMessageError.message);
            }

            const { error: updateConversationError } = await supabase
              .from("assistant_conversations")
              .update({
                title: nextTitle,
                updated_at: now,
              })
              .eq("id", conversationId)
              .eq("user_id", user.id);

            if (updateConversationError) {
              throw new Error(updateConversationError.message);
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "Content-Type": "text/plain; charset=utf-8",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant failed";
    const status = error instanceof GeminiApiError ? error.status : 500;
    return jsonError(message, status);
  }
}

async function loadProfile(userId: string): Promise<AssistantProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, target_role, location, bio")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data as AssistantProfile | null;
}

function shouldGenerateTitle(title: string | null) {
  return !title || title.trim().toLowerCase() === "new conversation";
}

function titleFromMessage(content: string) {
  const normalized = content.trim().replace(/\s+/g, " ");
  return normalized.length > 50 ? `${normalized.slice(0, 49)}...` : normalized;
}

function validUuidArray(values: string[]) {
  return values.filter(isUuid);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function jsonError(message: string, status: number) {
  return Response.json({ detail: message }, { status });
}
