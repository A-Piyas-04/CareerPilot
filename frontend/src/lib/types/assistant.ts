export type MessageRole = "user" | "assistant" | "system";

export type AssistantMode = "general_chat" | "interview_prep";

export type InterviewType = "behavioral" | "technical" | "coding" | "mixed";

export type InterviewDifficulty = "easy" | "medium" | "hard";

export type InterviewAction =
  | "start"
  | "answer"
  | "next_question"
  | "evaluate";

export type InterviewSettings = {
  targetRole?: string;
  applicationId?: string;
  jobId?: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  focusAreas: string[];
};

export type AssistantConversationContext = Record<string, unknown> & {
  mode?: AssistantMode;
  interview?: Partial<InterviewSettings>;
};

export type AssistantConversation = {
  id: string;
  user_id: string;
  title: string | null;
  context: AssistantConversationContext;
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
  context?: AssistantConversationContext;
};

export type SendAssistantMessageInput = {
  conversation: AssistantConversation;
  content: string;
  jobId?: string | null;
  mode?: AssistantMode;
  interviewAction?: InterviewAction;
  interviewSettings?: Partial<InterviewSettings>;
  problemId?: string | null;
};
