import { apiRequest } from "@/lib/api";

import {
  ALLOWED_RESUME_EXTENSIONS,
  MAX_RESUME_FILE_BYTES,
} from "./types";
import type {
  CvAnswerRequest,
  CvAnswerResponse,
  Resume,
  ResumeDetail,
  ResumeQueryRequest,
  ResumeQueryResponse,
} from "./types";

export function listResumes() {
  return apiRequest<Resume[]>("/api/v1/resumes");
}

export function getResume(resumeId: string) {
  return apiRequest<ResumeDetail>(`/api/v1/resumes/${resumeId}`);
}

export function validateResumeFile(file: File): void {
  const ext = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";
  if (
    !ALLOWED_RESUME_EXTENSIONS.includes(
      ext as (typeof ALLOWED_RESUME_EXTENSIONS)[number],
    )
  ) {
    throw new Error("Only PDF and DOCX files are supported.");
  }
  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw new Error("File is too large. Maximum size is 10 MB.");
  }
  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }
}

export function uploadResume(file: File) {
  validateResumeFile(file);
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<Resume>("/api/v1/resumes/upload", {
    method: "POST",
    body: formData,
  });
}

export function deleteResume(resumeId: string) {
  return apiRequest<void>(`/api/v1/resumes/${resumeId}`, {
    method: "DELETE",
  });
}

export function queryResume(payload: ResumeQueryRequest) {
  return apiRequest<ResumeQueryResponse>("/api/v1/resumes/query", {
    method: "POST",
    body: {
      query: payload.query,
      resume_id: payload.resume_id,
      top_k: payload.top_k ?? 5,
    },
  });
}

export function askCvQuestion(payload: CvAnswerRequest) {
  return apiRequest<CvAnswerResponse>("/api/v1/resumes/answer", {
    method: "POST",
    body: {
      question: payload.question,
      resume_id: payload.resume_id,
      top_k: payload.top_k ?? 5,
    },
  });
}
