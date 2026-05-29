export const RESUME_STATUSES = [
  "uploaded",
  "processing",
  "processed",
  "failed",
] as const;

export type ResumeStatus = (typeof RESUME_STATUSES)[number];

export type ParsedSummary = {
  section_count?: number;
  chunk_count?: number;
  skill_count?: number;
  section_names?: string[];
};

export type Resume = {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_url?: string | null;
  raw_text?: string | null;
  parsed_summary?: ParsedSummary | null;
  is_active: boolean;
  status: ResumeStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type ResumeSection = {
  id: string;
  resume_id: string;
  user_id: string;
  section_name: string;
  section_order: number;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export type ResumeSkill = {
  id: string;
  user_id: string;
  resume_id?: string | null;
  skill_name: string;
  category?: string | null;
  proficiency?: string | null;
  evidence?: string | null;
  source?: string;
  created_at: string;
};

export type ResumeDetail = {
  resume: Resume;
  sections: ResumeSection[];
  skills: ResumeSkill[];
  chunk_count: number;
};

export type ResumeQueryRequest = {
  query: string;
  resume_id?: string;
  top_k?: number;
};

export type ResumeQueryChunk = {
  chunk_id: string;
  resume_id: string;
  section_name?: string | null;
  chunk_text: string;
  similarity: number;
};

/** Backend returns a bare array from POST /api/v1/resumes/query */
export type ResumeQueryResponse = ResumeQueryChunk[];

export type CvAnswerRequest = {
  question: string;
  resume_id?: string;
  top_k?: number;
};

export type CvAnswerResponse = {
  answer: string;
  evidence_chunks: ResumeQueryChunk[];
};

export const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".docx"] as const;

export const BUILDER_SECTION_OPTIONS = [
  { value: "summary", label: "Summary" },
  { value: "experience", label: "Experience" },
  { value: "education", label: "Education" },
  { value: "skills", label: "Skills" },
  { value: "projects", label: "Projects" },
  { value: "certifications", label: "Certifications" },
  { value: "achievements", label: "Achievements" },
  { value: "publications", label: "Publications" },
  { value: "languages", label: "Languages" },
  { value: "general", label: "General" },
] as const;

export type BuilderSectionKey =
  (typeof BUILDER_SECTION_OPTIONS)[number]["value"];

const BUILDER_SECTION_VALUES = new Set<string>(
  BUILDER_SECTION_OPTIONS.map((o) => o.value),
);

/** Coerce parsed/uploaded section names into a valid builder dropdown value. */
export function normalizeBuilderSectionName(name: string): BuilderSectionKey {
  const key = name.trim().toLowerCase();
  if (BUILDER_SECTION_VALUES.has(key)) {
    return key as BuilderSectionKey;
  }
  return "summary";
}

export type BuilderSectionInput = {
  section_name: BuilderSectionKey;
  content: string;
};

export type BuildResumeRequest = {
  title: string;
  sections: BuilderSectionInput[];
};

export const MAX_BUILDER_SECTIONS = 12;
export const BUILDER_CONTENT_MAX = 20000;

export function pickPrimaryResume(resumes: Resume[]): Resume | null {
  if (resumes.length === 0) {
    return null;
  }
  return resumes.find((r) => r.is_active) ?? resumes[0];
}

export function formatResumeDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function truncateText(text: string, maxLength = 120): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}…`;
}

export function getPageStatusBadge(
  resumes: Resume[],
  selectedResume?: Resume | null,
): "no_cv" | "processing" | "failed" | "rag_ready" {
  if (resumes.length === 0) {
    return "no_cv";
  }
  const resume = selectedResume ?? pickPrimaryResume(resumes);
  if (!resume) {
    return "no_cv";
  }
  if (resume.status === "failed") {
    return "failed";
  }
  if (resume.status === "processed") {
    return "rag_ready";
  }
  return "processing";
}

export const PAGE_STATUS_LABELS: Record<
  ReturnType<typeof getPageStatusBadge>,
  string
> = {
  no_cv: "No CV Uploaded",
  processing: "Processing",
  failed: "Failed",
  rag_ready: "RAG Ready",
};
