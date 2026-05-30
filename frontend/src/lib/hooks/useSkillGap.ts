"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  analyzeSkillGap,
  getSkillGapAnalysis,
  listSkillGapAnalyses,
  type SkillGapAnalysisDetail,
} from "@/lib/career-api";

export const skillGapKeys = {
  all: ["skill-gap-analyses"] as const,
  detail: (id: string) => ["skill-gap-analysis", id] as const,
};

export function useSkillGapAnalyses() {
  return useQuery({
    queryKey: skillGapKeys.all,
    queryFn: () => listSkillGapAnalyses(),
  });
}

export function useSkillGapDetail(analysisId: string | null) {
  return useQuery({
    queryKey: skillGapKeys.detail(analysisId ?? ""),
    queryFn: () => getSkillGapAnalysis(analysisId!),
    enabled: Boolean(analysisId),
  });
}

export function useAnalyzeSkillGap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      target_role: string;
      job_description?: string;
      resume_id?: string | null;
      job_id?: string | null;
    }) => analyzeSkillGap(payload),
    onError: (error: Error) => {
      toast.error(error.message || "Could not analyze skill gaps.");
    },
    onSuccess: async (data: SkillGapAnalysisDetail) => {
      toast.success("Skill gap analysis saved.");
      await queryClient.invalidateQueries({ queryKey: skillGapKeys.all });
      return data;
    },
  });
}
