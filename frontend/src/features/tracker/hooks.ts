import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createApplication,
  deleteApplication,
  getApplicationDetail,
  listApplications,
  updateApplication,
  updateApplicationStatus,
} from "./api";
import type {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "./types";

export const trackerKeys = {
  applications: ["applications"] as const,
  detail: (id: string | null) => ["applications", id] as const,
};

export function useApplications() {
  return useQuery({
    queryKey: trackerKeys.applications,
    queryFn: listApplications,
  });
}

export function useApplicationDetail(applicationId: string | null) {
  return useQuery({
    queryKey: trackerKeys.detail(applicationId),
    queryFn: () => getApplicationDetail(applicationId!),
    enabled: Boolean(applicationId),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApplicationInput) => createApplication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.applications });
    },
  });
}

export function useUpdateApplication(applicationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateApplicationInput) =>
      updateApplication(applicationId!, input),
    onSuccess: (application) => {
      queryClient.setQueryData<Application[]>(
        trackerKeys.applications,
        (current) =>
          current?.map((item) =>
            item.id === application.id ? application : item,
          ) ?? [application],
      );
      queryClient.invalidateQueries({
        queryKey: trackerKeys.detail(applicationId),
      });
    },
  });
}

export function useUpdateApplicationStatus() {
  return useMutation({
    mutationFn: ({
      applicationId,
      status,
      note,
    }: {
      applicationId: string;
      status: ApplicationStatus;
      note?: string;
    }) => updateApplicationStatus(applicationId, status, note),
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: (_data, applicationId) => {
      queryClient.setQueryData<Application[]>(
        trackerKeys.applications,
        (current) => current?.filter((item) => item.id !== applicationId) ?? [],
      );
      queryClient.removeQueries({ queryKey: trackerKeys.detail(applicationId) });
    },
  });
}
