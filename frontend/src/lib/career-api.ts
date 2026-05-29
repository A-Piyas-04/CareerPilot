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
