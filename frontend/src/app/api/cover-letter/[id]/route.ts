import { NextRequest } from "next/server";

import {
  buildCoverLetterTitle,
  CoverLetterHttpError,
  fetchCoverLetterForUser,
  getAuthenticatedCoverLetterUser,
  isUuid,
  jsonError,
  normalizeCoverLetter,
} from "@/lib/cover-letter/server";
import type { CoverLetterTone, UpdateCoverLetterRequest } from "@/lib/cover-letter/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_TONES: CoverLetterTone[] = [
  "professional",
  "concise",
  "enthusiastic",
];

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isUuid(id)) {
      return jsonError("Invalid cover letter id.", 400);
    }

    const { supabase, user } = await getAuthenticatedCoverLetterUser();
    const coverLetter = await fetchCoverLetterForUser(supabase, id, user.id);

    return Response.json({ coverLetter });
  } catch (error) {
    if (error instanceof CoverLetterHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not load cover letter.", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isUuid(id)) {
      return jsonError("Invalid cover letter id.", 400);
    }

    const body = (await request.json()) as Partial<UpdateCoverLetterRequest>;
    const { supabase, user } = await getAuthenticatedCoverLetterUser();
    const existing = await fetchCoverLetterForUser(supabase, id, user.id);
    const nextJobTitle =
      typeof body.jobTitle === "string"
        ? body.jobTitle.trim()
        : existing.job_title ?? "";
    const nextCompanyName =
      typeof body.companyName === "string"
        ? body.companyName.trim()
        : existing.company_name ?? "";
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.content === "string") {
      const content = body.content.trim();

      if (!content) {
        return jsonError("Cover letter content cannot be empty.", 400);
      }

      updates.content = content;
    }

    if (typeof body.jobTitle === "string") {
      if (!nextJobTitle) {
        return jsonError("Job title cannot be empty.", 400);
      }
      updates.job_title = nextJobTitle;
    }

    if (typeof body.companyName === "string") {
      if (!nextCompanyName) {
        return jsonError("Company name cannot be empty.", 400);
      }
      updates.company_name = nextCompanyName;
    }

    if (typeof body.jobDescription === "string") {
      const jobDescription = body.jobDescription.trim();
      updates.job_description = jobDescription || null;
    }

    if (typeof body.extraNotes === "string") {
      const extraNotes = body.extraNotes.trim();
      updates.extra_notes = extraNotes || null;
    }

    if (typeof body.tone === "string") {
      if (!VALID_TONES.includes(body.tone as CoverLetterTone)) {
        return jsonError("Invalid tone.", 400);
      }
      updates.tone = body.tone;
    }

    if (nextJobTitle && nextCompanyName) {
      updates.title = buildCoverLetterTitle(nextJobTitle, nextCompanyName);
    }

    const { data, error } = await supabase
      .from("cover_letters")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Could not update cover letter.", 500);
    }

    return Response.json({ coverLetter: normalizeCoverLetter(data) });
  } catch (error) {
    if (error instanceof CoverLetterHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not update cover letter.", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isUuid(id)) {
      return jsonError("Invalid cover letter id.", 400);
    }

    const { supabase, user } = await getAuthenticatedCoverLetterUser();
    await fetchCoverLetterForUser(supabase, id, user.id);

    const { error } = await supabase
      .from("cover_letters")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return jsonError(error.message, 500);
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof CoverLetterHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not delete cover letter.", 500);
  }
}
