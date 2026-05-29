export type CoverLetterTone = "professional" | "concise" | "enthusiastic";

export type CoverLetter = {
  id: string;
  user_id: string;
  resume_id: string | null;
  job_id: string | null;
  title: string | null;
  job_title: string | null;
  company_name: string | null;
  job_description: string | null;
  tone: CoverLetterTone | null;
  extra_notes: string | null;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GenerateCoverLetterRequest = {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone: CoverLetterTone;
  extraNotes?: string;
  jobId?: string;
};

export type GenerateCoverLetterResponse = {
  coverLetter: CoverLetter;
};

export type CoverLetterListResponse = {
  coverLetters: CoverLetter[];
};

export type CoverLetterDetailResponse = {
  coverLetter: CoverLetter;
};

export type UpdateCoverLetterRequest = {
  content?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  tone?: CoverLetterTone;
  extraNotes?: string;
};

export type RegenerateCoverLetterResponse = {
  coverLetter: CoverLetter;
};
