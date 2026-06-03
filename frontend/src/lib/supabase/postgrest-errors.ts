/** Map PostgREST / Postgres messages to safe client-facing text. */
export function toUserFacingPostgrestError(message: string): string {
  if (/permission denied for table cover_letters/i.test(message)) {
    return (
      "Could not load saved cover letters. Apply database grants once: run " +
      "scripts/apply-remote-grants.sql in Supabase SQL Editor, or set DATABASE_URL and run " +
      "python backend/scripts/apply_remote_grants.py."
    );
  }

  if (/permission denied for table/i.test(message)) {
    return "Could not load data. Database permissions may need to be updated.";
  }

  return message;
}
