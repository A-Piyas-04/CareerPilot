import { redirect } from "next/navigation";

import { JobsPageClient } from "@/features/jobs/jobs-page-client";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/jobs");
  }

  return <JobsPageClient />;
}
