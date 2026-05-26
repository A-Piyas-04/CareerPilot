import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getResume, listResumes, queryResume, uploadResume } from "./api";
import type { ResumeQueryRequest } from "./types";

export const resumeKeys = {
  list: ["resumes"] as const,
  detail: (id: string | null) => ["resumes", id] as const,
};

export function useResumes() {
  return useQuery({
    queryKey: resumeKeys.list,
    queryFn: listResumes,
  });
}

export function useResume(resumeId?: string) {
  return useQuery({
    queryKey: resumeKeys.detail(resumeId ?? null),
    queryFn: () => getResume(resumeId!),
    enabled: Boolean(resumeId),
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadResume,
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.detail(resume.id),
      });
    },
  });
}

export function useQueryResume() {
  return useMutation({
    mutationFn: (payload: ResumeQueryRequest) => queryResume(payload),
  });
}
