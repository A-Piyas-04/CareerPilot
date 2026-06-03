import { createClient } from "@supabase/supabase-js";

import { requiredEnv } from "@/lib/env";

/** Server-only Supabase client (bypasses RLS). Always filter by `user_id` in queries. */
export function createServiceRoleClient() {
  return createClient(
    requiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requiredEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>;

export function createCoverLetterDbClient() {
  return createServiceRoleClient();
}
