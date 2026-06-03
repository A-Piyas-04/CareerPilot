import {
  CoverLetterHttpError,
  getAuthenticatedCoverLetterUser,
  jsonError,
  listCoverLettersForUser,
} from "@/lib/cover-letter/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user } = await getAuthenticatedCoverLetterUser();
    const coverLetters = await listCoverLettersForUser(user.id);

    return Response.json({ coverLetters });
  } catch (error) {
    if (error instanceof CoverLetterHttpError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Could not load cover letters.", 500);
  }
}
