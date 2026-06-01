import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Reads the current user from the local session without calling the Auth API.
 * Use for client-side routing only; protected routes still validate on the server.
 */
export async function getOptionalClientUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return null;
    }
    return data.session?.user ?? null;
  } catch {
    return null;
  }
}
