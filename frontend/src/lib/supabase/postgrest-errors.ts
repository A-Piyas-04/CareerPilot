/** Map PostgREST / Postgres messages to safe client-facing text. */
export function toUserFacingPostgrestError(message: string): string {
  if (/permission denied for table cover_letters/i.test(message)) {
    return "Could not load saved cover letters. In Supabase Dashboard → SQL Editor, run scripts/apply-remote-grants.sql (one-time database fix).";
  }

  if (/permission denied for table/i.test(message)) {
    return "Could not load data. Database permissions may need to be updated.";
  }

  return message;
}
