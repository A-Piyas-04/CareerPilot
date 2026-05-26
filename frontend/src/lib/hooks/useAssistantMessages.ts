"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  assistantConversationKeys,
  getCurrentAssistantUserId,
  isTemporaryAssistantConversationId,
} from "@/lib/hooks/useAssistantConversations";
import type {
  AssistantConversation,
  AssistantMessage,
  SendAssistantMessageInput,
} from "@/lib/types/assistant";

export const assistantMessageKeys = {
  list: (conversationId: string | null) =>
    ["assistant-messages", conversationId] as const,
};

export function useAssistantMessages(conversationId: string | null) {
  return useQuery({
    queryKey: assistantMessageKeys.list(conversationId),
    queryFn: () => fetchAssistantMessages(conversationId!),
    enabled:
      Boolean(conversationId) &&
      !isTemporaryAssistantConversationId(conversationId!),
  });
}

export function useSendAssistantMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendAssistantMessageInput) => {
      try {
        return await streamAssistantMessage(input, queryClient);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async ({ content, conversation }) => {
      await queryClient.cancelQueries({
        queryKey: assistantMessageKeys.list(conversation.id),
      });
      await queryClient.cancelQueries({
        queryKey: assistantConversationKeys.all,
      });

      const previousMessages = queryClient.getQueryData<AssistantMessage[]>(
        assistantMessageKeys.list(conversation.id),
      );
      const previousConversations = queryClient.getQueryData<
        AssistantConversation[]
      >(assistantConversationKeys.all);
      const userId = await getCurrentAssistantUserId();
      const now = new Date().toISOString();
      const optimisticUserMessage: AssistantMessage = {
        id: `temp-user-${crypto.randomUUID()}`,
        conversation_id: conversation.id,
        user_id: userId,
        role: "user",
        content,
        used_resume_chunks: null,
        used_job_id: null,
        metadata: { optimistic: true },
        created_at: now,
      };
      const nextTitle = shouldGenerateTitle(conversation.title)
        ? titleFromMessage(content)
        : conversation.title;

      queryClient.setQueryData<AssistantMessage[]>(
        assistantMessageKeys.list(conversation.id),
        (current) => [...(current ?? []), optimisticUserMessage],
      );

      queryClient.setQueryData<AssistantConversation[]>(
        assistantConversationKeys.all,
        (current) =>
          sortConversationsByUpdatedAt(
            current?.map((item) =>
              item.id === conversation.id
                ? { ...item, title: nextTitle, updated_at: now }
                : item,
            ) ?? [],
          ),
      );

      return {
        previousMessages,
        previousConversations,
      };
    },
    onError: (_error, input, context) => {
      queryClient.setQueryData(
        assistantMessageKeys.list(input.conversation.id),
        context?.previousMessages ?? [],
      );
      queryClient.setQueryData(
        assistantConversationKeys.all,
        context?.previousConversations ?? [],
      );
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({
        queryKey: assistantMessageKeys.list(input.conversation.id),
      });
      queryClient.invalidateQueries({
        queryKey: assistantConversationKeys.all,
      });
    },
  });
}

async function fetchAssistantMessages(conversationId: string) {
  const supabase = createClient();
  const userId = await getCurrentAssistantUserId();
  const { data, error } = await supabase
    .from("assistant_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    showErrorToast(error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as AssistantMessage[];
}

async function streamAssistantMessage(
  { content, conversation }: SendAssistantMessageInput,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (isTemporaryAssistantConversationId(conversation.id)) {
    throw new Error("Please wait for the conversation to finish creating.");
  }

  const response = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId: conversation.id,
      message: content,
    }),
  });

  if (!response.ok) {
    const error = await readErrorResponse(response);
    throw new Error(error);
  }

  if (!response.body) {
    throw new Error("Assistant response stream was empty.");
  }

  const assistantMessageId = `temp-assistant-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const assistantMessage: AssistantMessage = {
    id: assistantMessageId,
    conversation_id: conversation.id,
    user_id: conversation.user_id,
    role: "assistant",
    content: "",
    used_resume_chunks: null,
    used_job_id: null,
    metadata: { streaming: true },
    created_at: now,
  };

  queryClient.setQueryData<AssistantMessage[]>(
    assistantMessageKeys.list(conversation.id),
    (current) => [...(current ?? []), assistantMessage],
  );

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    fullContent += chunk;

    queryClient.setQueryData<AssistantMessage[]>(
      assistantMessageKeys.list(conversation.id),
      (current) =>
        current?.map((message) =>
          message.id === assistantMessageId
            ? { ...message, content: fullContent }
            : message,
        ) ?? [],
    );
  }

  const tail = decoder.decode();
  if (tail) {
    fullContent += tail;
  }

  queryClient.setQueryData<AssistantMessage[]>(
    assistantMessageKeys.list(conversation.id),
    (current) =>
      current?.map((message) =>
        message.id === assistantMessageId
          ? {
              ...message,
              content: fullContent,
              metadata: { streaming: false },
            }
          : message,
      ) ?? [],
  );

  return { assistantMessageId, fullContent };
}

async function readErrorResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await response.json()) as { detail?: string };
    return data.detail ?? "Could not send message. Please try again.";
  }

  return response.text();
}

function shouldGenerateTitle(title: string | null) {
  return !title || title.trim().toLowerCase() === "new conversation";
}

function titleFromMessage(content: string) {
  const normalized = content.trim().replace(/\s+/g, " ");
  return normalized.length > 50 ? `${normalized.slice(0, 49)}...` : normalized;
}

function sortConversationsByUpdatedAt(conversations: AssistantConversation[]) {
  return [...conversations].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
}

function showErrorToast(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("careerpilot-toast", {
      detail: { type: "error", message },
    }),
  );

  window.alert(message);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Could not send message. Please try again.";
}
