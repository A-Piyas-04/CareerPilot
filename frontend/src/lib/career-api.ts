import { apiRequest } from "@/lib/api";

export function saveCoverLetter(payload: {
  job_description: string;
  resume_id?: string | null;
  target_role?: string | null;
  title?: string;
}) {
  return apiRequest<{
    id: string;
    title: string | null;
    content: string;
    used_resume_chunks: string[];
  }>("/api/v1/career/cover-letters/generate", {
    method: "POST",
    body: {
      job_description: payload.job_description,
      resume_id: payload.resume_id ?? undefined,
      target_role: payload.target_role ?? undefined,
      title: payload.title,
    },
  });
}

export function saveRoadmap(payload: {
  target_role: string;
  duration_weeks?: number;
  resume_id?: string | null;
  job_description?: string;
}) {
  return apiRequest<{
    id: string;
    target_role: string;
    item_count: number;
    used_resume_chunks: string[];
  }>("/api/v1/career/roadmaps/generate", {
    method: "POST",
    body: {
      target_role: payload.target_role,
      duration_weeks: payload.duration_weeks ?? 8,
      resume_id: payload.resume_id ?? undefined,
      job_description: payload.job_description ?? "",
    },
  });
}

export type SkillGapAnalysisSummary = {
  id: string;
  target_role: string | null;
  current_skills: string[];
  required_skills: string[];
  missing_skills: string[];
  job_id: string | null;
  resume_id: string | null;
  created_at: string;
};

export type SkillGapAnalysisDetail = SkillGapAnalysisSummary & {
  recommendations: Record<string, unknown> | null;
  user_id: string;
};

export function analyzeSkillGap(payload: {
  target_role: string;
  job_description?: string;
  resume_id?: string | null;
  job_id?: string | null;
}) {
  return apiRequest<SkillGapAnalysisDetail>("/api/v1/career/skill-gap/analyze", {
    method: "POST",
    body: {
      target_role: payload.target_role,
      job_description: payload.job_description ?? "",
      resume_id: payload.resume_id ?? undefined,
      job_id: payload.job_id ?? undefined,
    },
  });
}

export function listSkillGapAnalyses(limit = 50) {
  return apiRequest<SkillGapAnalysisSummary[]>(
    `/api/v1/career/skill-gap?limit=${limit}`,
  );
}

export function getSkillGapAnalysis(analysisId: string) {
  return apiRequest<SkillGapAnalysisDetail>(
    `/api/v1/career/skill-gap/${analysisId}`,
  );
}
