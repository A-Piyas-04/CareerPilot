import { GeminiApiError, GEMINI_MODEL, createGeminiText } from "@/lib/gemini";
import { parseCoverLetterJson } from "@/lib/cover-letter/parser";
import { buildCoverLetterPrompt, COVER_LETTER_SYSTEM_PROMPT } from "@/lib/cover-letter/prompts";
import {
  buildCoverLetterTitle,
  coverLetterDbErrorMessage,
  CoverLetterHttpError,
  createCoverLetterDbClient,
  fetchCoverLetterForUser,
  getAuthenticatedCoverLetterUser,
  isUuid,
  jsonError,
  loadCoverLetterResumeContext,
  loadProfile,
  nextCoverLetterVersion,
  normalizeCoverLetter,
  resolveJobContext,
} from "@/lib/cover-letter/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isUuid(id)) {
      return jsonError("Invalid cover letter id.", 400);
    }

    const { supabase, user } = await getAuthenticatedCoverLetterUser();
    const db = createCoverLetterDbClient();
    const existing = await fetchCoverLetterForUser(id, user.id, db);
    const job = await resolveJobContext({
      jobId: existing.job_id ?? undefined,
      supabase,
      userId: user.id,
    });
    const jobTitle = (existing.job_title || job?.title || "").trim();
    const companyName = (existing.company_name || job?.company || "").trim();
    const jobDescription = (
      existing.job_description ||
      [job?.description, job?.requirements].filter(Boolean).join("\n\n")
    ).trim();

    if (!jobTitle || !companyName || !jobDescription) {
      return jsonError(
        "This cover letter is missing job details needed for regeneration.",
        400,
      );
    }

    const [profile, resumeContext] = await Promise.all([
      loadProfile(supabase, user.id),
      loadCoverLetterResumeContext(supabase, user.id, jobDescription),
    ]);
    const rawResponse = await createGeminiText({
      maxOutputTokens: 1800,
      model: GEMINI_MODEL,
      prompt: buildCoverLetterPrompt({
        companyName,
        extraNotes: existing.extra_notes ?? undefined,
        jobDescription,
        jobTitle,
        profile,
        resumeContext: resumeContext.text,
        tone: existing.tone ?? "professional",
      }),
      systemPrompt: COVER_LETTER_SYSTEM_PROMPT,
      temperature: 0.35,
    });
    const generated = parseCoverLetterJson(rawResponse);
    const version = await nextCoverLetterVersion({
      companyName,
      db,
      jobId: existing.job_id,
      jobTitle,
      userId: user.id,
    });
    const title = buildCoverLetterTitle(jobTitle, companyName);
    const { data, error } = await db
      .from("cover_letters")
      .insert({
        company_name: companyName,
        content: generated.content,
        extra_notes: existing.extra_notes,
        job_description: jobDescription,
        job_id: existing.job_id,
        job_title: jobTitle,
        metadata: {
          evidence_chunks: resumeContext.evidenceChunks,
          regenerated_from_id: existing.id,
          used_resume_chunks: resumeContext.usedResumeChunks,
        },
        resume_id: resumeContext.resumeId,
        title,
        tone: existing.tone ?? "professional",
        user_id: user.id,
        version,
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(
        coverLetterDbErrorMessage(error) ?? "Could not save regenerated letter.",
        500,
      );
    }

    return Response.json({ coverLetter: normalizeCoverLetter(data) });
  } catch (error) {
    if (error instanceof CoverLetterHttpError || error instanceof GeminiApiError) {
      return jsonError(error.message, error.status);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Could not regenerate cover letter.";
    return jsonError(message, 500);
  }
}
