import { getResumeContext } from "@/lib/assistant/getResumeContext";
import type { CoverLetter, CoverLetterTone } from "@/lib/cover-letter/types";
import {
  createCoverLetterDbClient,
  type ServiceRoleClient,
} from "@/lib/supabase/admin";

export { createCoverLetterDbClient };
import { toUserFacingPostgrestError } from "@/lib/supabase/postgrest-errors";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
export type CoverLetterDbClient = ServiceRoleClient;
type DbRow = Record<string, unknown>;

export class CoverLetterHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CoverLetterHttpError";
    this.status = status;
  }
}

export async function getAuthenticatedCoverLetterUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new CoverLetterHttpError("User not authenticated", 401);
  }

  return { supabase, user };
}

export async function loadCoverLetterResumeContext(
  supabase: SupabaseServerClient,
  userId: string,
  query: string,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new CoverLetterHttpError("Upload your CV at /resume before generating a cover letter.", 400);
  }

  const context = await getResumeContext({
    accessToken: session.access_token,
    intent: "cover_letter",
    query,
    userId,
  });

  if (!context.hasResume) {
    throw new CoverLetterHttpError(
      context.emptyReason || "Upload your CV at /resume before generating a cover letter.",
      400,
    );
  }

  if (context.usedResumeChunks.length === 0) {
    throw new CoverLetterHttpError(
      context.emptyReason || "No relevant CV evidence was found for this job description.",
      400,
    );
  }

  return {
    evidenceChunks: context.evidenceChunks,
    resumeId: context.resumeId,
    text: context.text,
    usedResumeChunks: context.usedResumeChunks,
  };
}

export async function loadProfile(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, target_role, location, bio")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export async function listCoverLettersForUser(
  userId: string,
  db: CoverLetterDbClient = createCoverLetterDbClient(),
) {
  const { data, error } = await db
    .from("cover_letters")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new CoverLetterHttpError(toUserFacingPostgrestError(error.message), 500);
  }

  return (data ?? []).map(normalizeCoverLetter);
}

export async function fetchCoverLetterForUser(
  coverLetterId: string,
  userId: string,
  db: CoverLetterDbClient = createCoverLetterDbClient(),
) {
  const { data, error } = await db
    .from("cover_letters")
    .select("*")
    .eq("id", coverLetterId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new CoverLetterHttpError("Cover letter not found", 404);
  }

  return normalizeCoverLetter(data);
}

export async function resolveJobContext({
  jobId,
  supabase,
  userId,
}: {
  jobId?: string;
  supabase: SupabaseServerClient;
  userId: string;
}) {
  if (!jobId) {
    return null;
  }

  if (!isUuid(jobId)) {
    throw new CoverLetterHttpError("Invalid job id.", 400);
  }

  const [{ data: match }, { data: application }] = await Promise.all([
    supabase
      .from("job_matches")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("applications")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!match && !application) {
    throw new CoverLetterHttpError("Job not found for this user.", 404);
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, title, company, description, requirements")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    throw new CoverLetterHttpError("Job not found.", 404);
  }

  return {
    id: stringValue(job.id),
    title: stringValue(job.title),
    company: nullableString(job.company),
    description: nullableString(job.description),
    requirements: nullableString(job.requirements),
  };
}

export async function nextCoverLetterVersion({
  companyName,
  db = createCoverLetterDbClient(),
  jobId,
  jobTitle,
  userId,
}: {
  companyName: string;
  db?: CoverLetterDbClient;
  jobId: string | null;
  jobTitle: string;
  userId: string;
}) {
  let query = db.from("cover_letters").select("version").eq("user_id", userId);

  if (jobId) {
    query = query.eq("job_id", jobId);
  } else {
    query = query.eq("job_title", jobTitle).eq("company_name", companyName);
  }

  const { data, error } = await query;

  if (error) {
    throw new CoverLetterHttpError(toUserFacingPostgrestError(error.message), 500);
  }

  const maxVersion = (data ?? []).reduce((max, row) => {
    const version = typeof row.version === "number" ? row.version : Number(row.version);
    return Number.isFinite(version) && version > max ? version : max;
  }, 0);

  return maxVersion + 1;
}

export function normalizeCoverLetter(row: DbRow): CoverLetter {
  return {
    company_name: nullableString(row.company_name),
    content: stringValue(row.content),
    created_at: stringValue(row.created_at),
    extra_notes: nullableString(row.extra_notes),
    id: stringValue(row.id),
    job_description: nullableString(row.job_description),
    job_id: nullableString(row.job_id),
    job_title: nullableString(row.job_title),
    metadata: metadataValue(row.metadata),
    resume_id: nullableString(row.resume_id),
    title: nullableString(row.title),
    tone: toneValue(row.tone),
    updated_at: stringValue(row.updated_at),
    user_id: stringValue(row.user_id),
    version: numberValue(row.version) || 1,
  };
}

export function buildCoverLetterTitle(jobTitle: string, companyName: string) {
  return `${jobTitle.trim()} at ${companyName.trim()}`;
}

export function jsonError(message: string, status: number) {
  return Response.json({ detail: toUserFacingPostgrestError(message) }, { status });
}

export function coverLetterDbErrorMessage(error: { message: string } | null) {
  return error
    ? toUserFacingPostgrestError(error.message)
    : "Cover letter request failed.";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function toneValue(value: unknown): CoverLetterTone | null {
  return value === "professional" || value === "concise" || value === "enthusiastic"
    ? value
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function metadataValue(value: unknown): CoverLetter["metadata"] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as CoverLetter["metadata"];
}
