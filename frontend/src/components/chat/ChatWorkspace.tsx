"use client";

import { useMemo, useState } from "react";

import {
  isTemporaryAssistantConversationId,
  useAssistantConversations,
  useCreateAssistantConversation,
  useDeleteAssistantConversation,
} from "@/lib/hooks/useAssistantConversations";

import { ChatThread } from "./ChatThread";
import { ConversationSidebar } from "./ConversationSidebar";

export function ChatWorkspace() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const conversationsQuery = useAssistantConversations();
  const createConversationMutation = useCreateAssistantConversation();
  const deleteConversationMutation = useDeleteAssistantConversation();
  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const persistedConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) => !isTemporaryAssistantConversationId(conversation.id),
      ),
    [conversations],
  );
  const activeConversation = useMemo(
    () =>
      persistedConversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ??
      persistedConversations[0] ??
      null,
    [activeConversationId, persistedConversations],
  );

  async function handleCreateConversation() {
    const conversation = await createConversationMutation.mutateAsync({
      title: "New conversation",
    });
    setActiveConversationId(conversation.id);
  }

  async function handleDeleteConversation(conversationId: string) {
    if (!confirm("Delete this conversation?")) {
      return;
    }

    await deleteConversationMutation.mutateAsync(conversationId);

    if (conversationId === activeConversationId) {
      setActiveConversationId(null);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f6f7f9] lg:flex-row">
      <ConversationSidebar
        activeConversationId={activeConversation?.id ?? null}
        conversations={conversations}
        errorMessage={conversationsQuery.error?.message}
        isCreating={createConversationMutation.isPending}
        isDeleting={deleteConversationMutation.isPending}
        isLoading={conversationsQuery.isLoading}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onSelectConversation={setActiveConversationId}
      />
      <ChatThread conversation={activeConversation} />
    </main>
  );
}
