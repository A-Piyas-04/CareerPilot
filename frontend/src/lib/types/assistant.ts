export type MessageRole = "user" | "assistant" | "system";

export type AssistantConversation = {
  id: string;
  user_id: string;
  title: string | null;
  context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AssistantMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  used_resume_chunks: string[] | null;
  used_job_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CreateAssistantConversationInput = {
  title?: string;
};

export type SendAssistantMessageInput = {
  conversation: AssistantConversation;
  content: string;
};
