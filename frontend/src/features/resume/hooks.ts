import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  askCvQuestion,
  buildResume,
  deleteResume,
  getResume,
  listResumes,
  queryResume,
  rebuildResume,
  uploadResume,
} from "./api";
import type {
  BuildResumeRequest,
  CvAnswerRequest,
  ResumeQueryRequest,
} from "./types";

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

export function useBuildResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BuildResumeRequest) => buildResume(payload),
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.detail(resume.id),
      });
      toast.success(`"${resume.file_name}" saved and indexed.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not save CV. Please try again.");
    },
  });
}

export function useRebuildResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resumeId,
      payload,
    }: {
      resumeId: string;
      payload: BuildResumeRequest;
    }) => rebuildResume(resumeId, payload),
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.detail(resume.id),
      });
      toast.success(`"${resume.file_name}" updated and re-indexed.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update CV. Please try again.");
    },
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
      toast.success(`"${resume.file_name}" uploaded and processed.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Upload failed. Please try again.");
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list });
      toast.success("Resume deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete resume.");
    },
  });
}

export function useQueryResume() {
  return useMutation({
    mutationFn: (payload: ResumeQueryRequest) => queryResume(payload),
  });
}

export function useAskCvQuestion() {
  return useMutation({
    mutationFn: (payload: CvAnswerRequest) => askCvQuestion(payload),
    onError: (error: Error) => {
      toast.error(error.message || "Could not get an answer. Try again.");
    },
  });
}
