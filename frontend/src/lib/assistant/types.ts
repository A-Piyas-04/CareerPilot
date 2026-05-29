export type AssistantProfile = {
  full_name: string | null;
  email: string | null;
  target_role: string | null;
  location: string | null;
  bio: string | null;
};

export type ResumeEvidenceChunk = {
  chunk_id: string;
  resume_id: string;
  section_name: string | null;
  chunk_text: string;
  similarity: number;
};

export type ResumeContextResult = {
  text: string;
  usedResumeChunks: string[];
  resumeId: string | null;
  hasResume: boolean;
  emptyReason: string | null;
  evidenceChunks: ResumeEvidenceChunk[];
  userSkills: string[];
};

export type ConversationMemoryMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
