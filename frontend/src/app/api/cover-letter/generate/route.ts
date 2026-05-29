import { NextRequest } from "next/server";

import { GeminiApiError, GEMINI_MODEL, createGeminiText } from "@/lib/gemini";
import { parseCoverLetterJson } from "@/lib/cover-letter/parser";
import { buildCoverLetterPrompt, COVER_LETTER_SYSTEM_PROMPT } from "@/lib/cover-letter/prompts";
import {
  buildCoverLetterTitle,
  CoverLetterHttpError,
  getAuthenticatedCoverLetterUser,
  jsonError,
  loadCoverLetterResumeContext,
  loadProfile,
  normalizeCoverLetter,
  resolveJobContext,
} from "@/lib/cover-letter/server";
import type { CoverLetterTone, GenerateCoverLetterRequest } from "@/lib/cover-letter/types";

export const runtime = "nodejs";

const VALID_TONES: CoverLetterTone[] = [
  "professional",
  "concise",
  "enthusiastic",
];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<GenerateCoverLetterRequest>;
    const tone = normalizeTone(body.tone);
    const extraNotes =
      typeof body.extraNotes === "string" ? body.extraNotes.trim() : "";
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const { supabase, user } = await getAuthenticatedCoverLetterUser();
    const job = await resolveJobContext({
      jobId: jobId || undefined,
      supabase,
      userId: user.id,
    });
    const jobTitle = (
      job?.title ||
      (typeof body.jobTitle === "string" ? body.jobTitle : "")
    ).trim();
    const companyName = (
      job?.company ||
      (typeof body.companyName === "string" ? body.companyName : "")
    ).trim();
    const jobDescription = (
      [job?.description, job?.requirements].filter(Boolean).join("\n\n") ||
      (typeof body.jobDescription === "string" ? body.jobDescription : "")
    ).trim();

    if (!jobTitle) {
      return jsonError("Job title is required.", 400);
    }

    if (!companyName) {
      return jsonError("Company name is required.", 400);
    }

    if (!jobDescription) {
      return jsonError("Job description is required.", 400);
    }

    const [profile, resumeContext] = await Promise.all([
      loadProfile(supabase, user.id),
      loadCoverLetterResumeContext(supabase, user.id),
    ]);
    const rawResponse = await createGeminiText({
      maxOutputTokens: 1800,
      model: GEMINI_MODEL,
      prompt: buildCoverLetterPrompt({
        companyName,
        extraNotes,
        jobDescription,
        jobTitle,
        profile,
        resumeContext: resumeContext.text,
        tone,
      }),
      systemPrompt: COVER_LETTER_SYSTEM_PROMPT,
      temperature: 0.35,
    });
    const generated = parseCoverLetterJson(rawResponse);
    const title = buildCoverLetterTitle(jobTitle, companyName);
    const { data, error } = await supabase
      .from("cover_letters")
      .insert({
        company_name: companyName,
        content: generated.content,
        extra_notes: extraNotes || null,
        job_description: jobDescription,
        job_id: job?.id ?? null,
        job_title: jobTitle,
        resume_id: resumeContext.resumeId,
        title,
        tone,
        user_id: user.id,
        version: 1,
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Could not save cover letter.", 500);
    }

    return Response.json({ coverLetter: normalizeCoverLetter(data) });
  } catch (error) {
    if (error instanceof CoverLetterHttpError || error instanceof GeminiApiError) {
      return jsonError(error.message, error.status);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Could not generate cover letter. Please try again.";
    return jsonError(message, 500);
  }
}

function normalizeTone(value: unknown): CoverLetterTone {
  return VALID_TONES.includes(value as CoverLetterTone)
    ? (value as CoverLetterTone)
    : "professional";
}
