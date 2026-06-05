import { redirect } from "next/navigation";

import { JobsPageClient } from "@/features/jobs/jobs-page-client";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "jobs page");

  if (!user) {
    redirect("/login?next=/jobs");
  }

  return <JobsPageClient />;
}
