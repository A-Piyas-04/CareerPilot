"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type {
  AssistantConversation,
  CreateAssistantConversationInput,
} from "@/lib/types/assistant";

export const assistantConversationKeys = {
  all: ["assistant-conversations"] as const,
};

export function isTemporaryAssistantConversationId(conversationId: string) {
  return conversationId.startsWith("temp-");
}

export function useAssistantConversations() {
  return useQuery({
    queryKey: assistantConversationKeys.all,
    queryFn: fetchAssistantConversations,
  });
}

export function useCreateAssistantConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssistantConversationInput = {}) => {
      try {
        return await createAssistantConversation(input);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: assistantConversationKeys.all,
      });
      const previous = queryClient.getQueryData<AssistantConversation[]>(
        assistantConversationKeys.all,
      );
      const userId = await getCurrentUserId();
      const now = new Date().toISOString();
      const optimisticConversation: AssistantConversation = {
        id: `temp-${crypto.randomUUID()}`,
        user_id: userId,
        title: input.title ?? "New conversation",
        context: {},
        created_at: now,
        updated_at: now,
      };

      queryClient.setQueryData<AssistantConversation[]>(
        assistantConversationKeys.all,
        (current) => [optimisticConversation, ...(current ?? [])],
      );

      return { previous, optimisticId: optimisticConversation.id };
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<AssistantConversation[]>(
        assistantConversationKeys.all,
        (current) =>
          current?.map((conversation) =>
            conversation.id === context.optimisticId ? created : conversation,
          ) ?? [created],
      );
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(
        assistantConversationKeys.all,
        context?.previous ?? [],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: assistantConversationKeys.all,
      });
    },
  });
}

export function useDeleteAssistantConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        await deleteAssistantConversation(conversationId);
      } catch (error) {
        showErrorToast(getErrorMessage(error));
        throw error;
      }
    },
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({
        queryKey: assistantConversationKeys.all,
      });
      const previous = queryClient.getQueryData<AssistantConversation[]>(
        assistantConversationKeys.all,
      );

      queryClient.setQueryData<AssistantConversation[]>(
        assistantConversationKeys.all,
        (current) =>
          current?.filter((conversation) => conversation.id !== conversationId) ??
          [],
      );

      return { previous };
    },
    onError: (_error, _conversationId, context) => {
      queryClient.setQueryData(
        assistantConversationKeys.all,
        context?.previous ?? [],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: assistantConversationKeys.all,
      });
    },
  });
}

async function fetchAssistantConversations() {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("assistant_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    showErrorToast(error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as AssistantConversation[];
}

async function createAssistantConversation(
  input: CreateAssistantConversationInput,
) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("assistant_conversations")
    .insert({
      user_id: userId,
      title: input.title ?? "New conversation",
      context: {},
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AssistantConversation;
}

async function deleteAssistantConversation(conversationId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("assistant_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentAssistantUserId() {
  return getCurrentUserId();
}

async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You need to sign in again.");
  }

  return user.id;
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
  return error instanceof Error ? error.message : "Assistant request failed.";
}
