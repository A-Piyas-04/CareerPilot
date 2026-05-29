import type { AssistantIntent } from "@/lib/assistant/detectIntent";
import type { ResumeContextResult } from "@/lib/assistant/types";
import { serverApiRequest } from "@/lib/api-server";

type RagContextApiResponse = {
  resume_id: string | null;
  resume_status: string | null;
  has_resume: boolean;
  chunks: Array<{
    chunk_id: string;
    resume_id: string;
    section_name: string | null;
    chunk_text: string;
    similarity: number;
  }>;
  chunk_ids: string[];
  context_text: string;
  user_skills: string[];
  empty_reason: string | null;
};

type GetResumeContextParams = {
  userId: string;
  accessToken: string;
  query: string;
  intent?: AssistantIntent;
};

export async function getResumeContext(
  params: GetResumeContextParams,
): Promise<ResumeContextResult> {
  void params.userId;

  try {
    const data = await serverApiRequest<RagContextApiResponse>(
      "/api/v1/rag/context",
      {
        accessToken: params.accessToken,
        method: "POST",
        body: {
          query: params.query,
          intent: params.intent ?? "general",
        },
      },
    );

    const evidenceChunks = data.chunks.map((chunk) => ({
      chunk_id: chunk.chunk_id,
      resume_id: chunk.resume_id,
      section_name: chunk.section_name,
      chunk_text: chunk.chunk_text,
      similarity: chunk.similarity,
    }));

    let text = data.context_text;
    if (!data.has_resume && data.empty_reason) {
      text = `[No CV on file] ${data.empty_reason}`;
    } else if (data.has_resume && !text && data.empty_reason) {
      text = `[CV uploaded but no matching sections] ${data.empty_reason}`;
    }

    if (data.user_skills.length > 0) {
      text += `\n\n[Extracted skills from CV]\n${data.user_skills.join(", ")}`;
    }

    return {
      text,
      usedResumeChunks: data.chunk_ids,
      resumeId: data.resume_id,
      hasResume: data.has_resume,
      emptyReason: data.empty_reason,
      evidenceChunks,
      userSkills: data.user_skills,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load resume context.";
    return {
      text: `[Resume context unavailable] ${message}. Upload your CV at /resume and try again.`,
      usedResumeChunks: [],
      resumeId: null,
      hasResume: false,
      emptyReason: message,
      evidenceChunks: [],
      userSkills: [],
    };
  }
}
