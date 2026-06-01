"use client";

import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui";
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
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(
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
    await deleteConversationMutation.mutateAsync(conversationId);

    if (conversationId === activeConversationId) {
      setActiveConversationId(null);
    }
    setDeleteConversationId(null);
  }

  return (
    <main className="cp-page flex min-h-screen flex-col lg:flex-row">
      <ConversationSidebar
        activeConversationId={activeConversation?.id ?? null}
        conversations={conversations}
        errorMessage={conversationsQuery.error?.message}
        isCreating={createConversationMutation.isPending}
        isDeleting={deleteConversationMutation.isPending}
        isLoading={conversationsQuery.isLoading}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={setDeleteConversationId}
        onSelectConversation={setActiveConversationId}
      />
      <ChatThread conversation={activeConversation} />
      <ConfirmDialog
        isOpen={Boolean(deleteConversationId)}
        title="Delete conversation?"
        description="This removes the saved conversation and its messages from your workspace."
        confirmLabel="Delete"
        onCancel={() => setDeleteConversationId(null)}
        onConfirm={() => {
          if (deleteConversationId) {
            void handleDeleteConversation(deleteConversationId);
          }
        }}
      />
    </main>
  );
}
