import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  askCvQuestion,
  createManualResume,
  deleteResume,
  getResume,
  listResumes,
  queryResume,
  updateManualResume,
  uploadResume,
} from "./api";
import type { CvAnswerRequest, ManualResumePayload, ResumeQueryRequest } from "./types";

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

export function useCreateManualResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualResumePayload) => createManualResume(payload),
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.detail(resume.id),
      });
      toast.success(`"${resume.file_name}" saved.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save manual CV.");
    },
  });
}

export function useUpdateManualResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateManualResume,
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: resumeKeys.list });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.detail(resume.id),
      });
      toast.success(`"${resume.file_name}" updated.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update manual CV.");
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
