export type AssistantProfile = {
  full_name: string | null;
  email: string | null;
  target_role: string | null;
  location: string | null;
  bio: string | null;
};

export type ResumeContextResult = {
  text: string;
  usedResumeChunks: string[];
};

export type ConversationMemoryMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
