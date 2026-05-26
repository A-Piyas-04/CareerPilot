import { apiRequest } from "@/lib/api";

import type {
  Application,
  ApplicationDetail,
  ApplicationStatus,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "./types";

export function listApplications() {
  return apiRequest<Application[]>("/api/v1/applications");
}

export function createApplication(input: CreateApplicationInput) {
  return apiRequest<Application>("/api/v1/applications", {
    method: "POST",
    body: input,
  });
}

export function getApplicationDetail(applicationId: string) {
  return apiRequest<ApplicationDetail>(`/api/v1/applications/${applicationId}`);
}

export function updateApplication(
  applicationId: string,
  input: UpdateApplicationInput,
) {
  return apiRequest<Application>(`/api/v1/applications/${applicationId}`, {
    method: "PATCH",
    body: input,
  });
}

export function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  note?: string,
) {
  return apiRequest<Application>(
    `/api/v1/applications/${applicationId}/status`,
    {
      method: "PATCH",
      body: { status, note },
    },
  );
}

export function deleteApplication(applicationId: string) {
  return apiRequest<void>(`/api/v1/applications/${applicationId}`, {
    method: "DELETE",
  });
}
