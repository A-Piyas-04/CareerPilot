import {
  CoverLetterHttpError,
  getAuthenticatedCoverLetterUser,
  jsonError,
  normalizeCoverLetter,
} from "@/lib/cover-letter/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedCoverLetterUser();
    const { data, error } = await supabase
      .from("cover_letters")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return Response.json({
      coverLetters: (data ?? []).map(normalizeCoverLetter),
    });
  } catch (error) {
    if (error instanceof CoverLetterHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not load cover letters.", 500);
  }
}
