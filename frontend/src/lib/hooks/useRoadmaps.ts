"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AddRoadmapCalendarEventResponse,
  CreateRoadmapTaskResponse,
  GenerateRoadmapRequest,
  GenerateRoadmapResponse,
  RoadmapDetailResponse,
  RoadmapItemStatus,
  RoadmapListItem,
} from "@/lib/roadmap/types";

type RoadmapListResponse = {
  roadmaps: RoadmapListItem[];
};

type UpdateRoadmapItemResponse = {
  progress: number;
  item: RoadmapDetailResponse["items"][number];
};

export function useRoadmaps() {
  return useQuery({
    queryFn: () => requestJson<RoadmapListResponse>("/api/roadmap"),
    queryKey: ["roadmaps"],
  });
}

export function useRoadmapDetail(roadmapId: string) {
  return useQuery({
    enabled: Boolean(roadmapId),
    queryFn: () => requestJson<RoadmapDetailResponse>(`/api/roadmap/${roadmapId}`),
    queryKey: ["roadmap", roadmapId],
  });
}

export function useGenerateRoadmap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateRoadmapRequest) =>
      requestJson<GenerateRoadmapResponse>("/api/roadmap/generate", {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    onError: (error) => {
      toast.error(error.message || "Could not generate roadmap.");
    },
    onSuccess: async () => {
      toast.success("Roadmap generated.");
      await queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

export function useUpdateRoadmapItemStatus(roadmapId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      status,
    }: {
      itemId: string;
      status: RoadmapItemStatus;
    }) =>
      requestJson<UpdateRoadmapItemResponse>(`/api/roadmap/items/${itemId}`, {
        body: JSON.stringify({ status }),
        method: "PATCH",
      }),
    onError: (error) => {
      toast.error(error.message || "Could not update roadmap item.");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] }),
        queryClient.invalidateQueries({ queryKey: ["roadmaps"] }),
      ]);
    },
  });
}

export function useCreateRoadmapTask(roadmapId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      requestJson<CreateRoadmapTaskResponse>(
        `/api/roadmap/items/${itemId}/create-task`,
        { method: "POST" },
      ),
    onError: (error) => {
      toast.error(error.message || "Could not create task.");
    },
    onSuccess: async (data) => {
      toast.success(data.created ? "Task created." : "Task already exists.");
      await queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] });
    },
  });
}

export function useAddRoadmapItemToCalendar(roadmapId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      endTime,
      itemId,
      startTime,
    }: {
      endTime?: string;
      itemId: string;
      startTime: string;
    }) =>
      requestJson<AddRoadmapCalendarEventResponse>(
        `/api/roadmap/items/${itemId}/add-to-calendar`,
        {
          body: JSON.stringify({ endTime, startTime }),
          method: "POST",
        },
      ),
    onError: (error) => {
      toast.error(error.message || "Could not add event to calendar.");
    },
    onSuccess: async () => {
      toast.success("Study event added to calendar.");
      await queryClient.invalidateQueries({ queryKey: ["roadmap", roadmapId] });
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
