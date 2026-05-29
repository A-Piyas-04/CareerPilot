"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CoverLetterDetailResponse,
  CoverLetterListResponse,
  GenerateCoverLetterRequest,
  GenerateCoverLetterResponse,
  RegenerateCoverLetterResponse,
  UpdateCoverLetterRequest,
} from "@/lib/cover-letter/types";

export function useCoverLetters() {
  return useQuery({
    queryFn: () => requestJson<CoverLetterListResponse>("/api/cover-letter"),
    queryKey: ["cover-letters"],
  });
}

export function useCoverLetterDetail(coverLetterId: string) {
  return useQuery({
    enabled: Boolean(coverLetterId),
    queryFn: () =>
      requestJson<CoverLetterDetailResponse>(`/api/cover-letter/${coverLetterId}`),
    queryKey: ["cover-letter", coverLetterId],
  });
}

export function useGenerateCoverLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateCoverLetterRequest) =>
      requestJson<GenerateCoverLetterResponse>("/api/cover-letter/generate", {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    onError: (error) => {
      toast.error(error.message || "Could not generate cover letter.");
    },
    onSuccess: async () => {
      toast.success("Cover letter generated.");
      await queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
    },
  });
}

export function useUpdateCoverLetter(coverLetterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCoverLetterRequest) =>
      requestJson<CoverLetterDetailResponse>(`/api/cover-letter/${coverLetterId}`, {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
    onError: (error) => {
      toast.error(error.message || "Could not update cover letter.");
    },
    onSuccess: async () => {
      toast.success("Cover letter saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cover-letter", coverLetterId] }),
        queryClient.invalidateQueries({ queryKey: ["cover-letters"] }),
      ]);
    },
  });
}

export function useRegenerateCoverLetter(coverLetterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      requestJson<RegenerateCoverLetterResponse>(
        `/api/cover-letter/${coverLetterId}/regenerate`,
        { method: "POST" },
      ),
    onError: (error) => {
      toast.error(error.message || "Could not regenerate cover letter.");
    },
    onSuccess: async () => {
      toast.success("New cover letter version created.");
      await queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
    },
  });
}

export function useDeleteCoverLetter(coverLetterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      requestJson<{ ok: boolean }>(`/api/cover-letter/${coverLetterId}`, {
        method: "DELETE",
      }),
    onError: (error) => {
      toast.error(error.message || "Could not delete cover letter.");
    },
    onSuccess: async () => {
      toast.success("Cover letter deleted.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cover-letter", coverLetterId] }),
        queryClient.invalidateQueries({ queryKey: ["cover-letters"] }),
      ]);
    },
  });
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    detail?: string;
  };

  if (!response.ok) {
    throw new Error(payload.detail ?? "Request failed.");
  }

  return payload as T;
}
