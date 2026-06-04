import type { AssistantIntent } from "@/lib/assistant/detectIntent";
import type { ResumeContextResult } from "@/lib/assistant/types";
import { serverApiRequest } from "@/lib/api-server";
import { createClient } from "@/lib/supabase/server";

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

type ResumeFallbackRow = {
  id: string;
  file_name: string | null;
  raw_text: string | null;
  status: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

type ResumeSectionFallbackRow = {
  section_name: string | null;
  content: string | null;
};

type UserSkillFallbackRow = {
  skill_name: string | null;
};

const MAX_FALLBACK_CONTEXT_CHARS = 6000;

export async function getResumeContext(
  params: GetResumeContextParams,
): Promise<ResumeContextResult> {
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

    if (!data.has_resume) {
      const fallback = await getSupabaseResumeFallback(params.userId);
      if (fallback.hasResume) {
        return fallback;
      }
      return resumeContextFromRagResponse(data);
    }

    const ragResult = resumeContextFromRagResponse(data);
    const hasRagEvidence =
      data.context_text.trim().length > 0 ||
      data.chunk_ids.length > 0 ||
      data.user_skills.length > 0;

    if (hasRagEvidence) {
      return ragResult;
    }

    const fallback = await getSupabaseResumeFallback(params.userId);
    if (fallback.hasResume && fallback.text.trim()) {
      return fallback;
    }

    return ragResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load resume context.";
    const fallback = await getSupabaseResumeFallback(params.userId);
    if (fallback.hasResume) {
      return {
        ...fallback,
        emptyReason: `Backend RAG context unavailable: ${message}`,
      };
    }

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

function resumeContextFromRagResponse(
  data: RagContextApiResponse,
): ResumeContextResult {
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
}

async function getSupabaseResumeFallback(
  userId: string,
): Promise<ResumeContextResult> {
  try {
    const supabase = await createClient();
    const { data: resumes, error: resumeError } = await supabase
      .from("resumes")
      .select("id, file_name, raw_text, status, is_active, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (resumeError || !Array.isArray(resumes) || resumes.length === 0) {
      return emptyResumeFallback();
    }

    const resume = pickFallbackResume(resumes as ResumeFallbackRow[]);
    const [sectionsResult, skillsResult] = await Promise.all([
      supabase
        .from("resume_sections")
        .select("section_name, content")
        .eq("user_id", userId)
        .eq("resume_id", resume.id)
        .order("section_order", { ascending: true }),
      supabase
        .from("user_skills")
        .select("skill_name")
        .eq("user_id", userId)
        .eq("resume_id", resume.id)
        .order("skill_name", { ascending: true }),
    ]);

    const sections = Array.isArray(sectionsResult.data)
      ? (sectionsResult.data as ResumeSectionFallbackRow[])
      : [];
    const userSkills = Array.isArray(skillsResult.data)
      ? dedupeSkillNames(skillsResult.data as UserSkillFallbackRow[])
      : [];
    const text = buildFallbackResumeText({ resume, sections, userSkills });

    return {
      text,
      usedResumeChunks: resume.id ? [`fallback:${resume.id}`] : [],
      resumeId: resume.id,
      hasResume: true,
      emptyReason:
        resume.status === "processed"
          ? "Semantic RAG chunks were unavailable, so the latest processed CV text was used directly."
          : `CV status is ${resume.status ?? "unknown"}; using available CV text directly while processing completes.`,
      evidenceChunks: [],
      userSkills,
    };
  } catch (error) {
    return {
      ...emptyResumeFallback(),
      emptyReason:
        error instanceof Error
          ? error.message
          : "Could not load resume fallback context.",
    };
  }
}

function pickFallbackResume(resumes: ResumeFallbackRow[]) {
  return (
    resumes.find((resume) => resume.status === "processed" && resume.is_active) ??
    resumes.find((resume) => resume.status === "processed") ??
    resumes.find((resume) => resume.is_active) ??
    resumes[0]
  );
}

function buildFallbackResumeText({
  resume,
  sections,
  userSkills,
}: {
  resume: ResumeFallbackRow;
  sections: ResumeSectionFallbackRow[];
  userSkills: string[];
}) {
  const parts = [
    `[CV fallback context from ${resume.file_name ?? "latest resume"}]`,
    `Resume status: ${resume.status ?? "unknown"}`,
  ];
  const rawText = resume.raw_text?.trim();

  if (rawText) {
    parts.push(rawText);
  } else if (sections.length > 0) {
    parts.push(
      sections
        .map((section) => {
          const name = section.section_name?.trim() || "General";
          return `[${name}]\n${section.content?.trim() ?? ""}`;
        })
        .filter((section) => section.trim().length > 0)
        .join("\n\n"),
    );
  } else {
    parts.push("The CV record exists, but no readable resume text was found.");
  }

  if (userSkills.length > 0) {
    parts.push(`[Extracted skills from CV]\n${userSkills.join(", ")}`);
  }

  return parts.join("\n\n").slice(0, MAX_FALLBACK_CONTEXT_CHARS);
}

function dedupeSkillNames(rows: UserSkillFallbackRow[]) {
  const seen = new Set<string>();
  const skills: string[] = [];

  for (const row of rows) {
    const skill = row.skill_name?.trim();
    const key = skill?.toLowerCase();
    if (!skill || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    skills.push(skill);
  }

  return skills;
}

function emptyResumeFallback(): ResumeContextResult {
  return {
    text: "",
    usedResumeChunks: [],
    resumeId: null,
    hasResume: false,
    emptyReason: null,
    evidenceChunks: [],
    userSkills: [],
  };
}
