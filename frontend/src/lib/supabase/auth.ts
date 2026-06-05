import type { User } from "@supabase/supabase-js";

type SupabaseAuthClient = {
  auth: {
    getUser: () => Promise<{
      data: {
        user: User | null;
      };
    }>;
  };
};

export async function getServerUser(
  supabase: SupabaseAuthClient,
  context = "supabase auth",
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error(`[${context}] auth.getUser failed`, error);
    return null;
  }
}
