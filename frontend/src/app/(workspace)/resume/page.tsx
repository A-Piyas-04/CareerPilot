import { redirect } from "next/navigation";

import { ResumePageClient } from "@/features/resume/resume-page-client";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ResumePage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "resume page");

  if (!user) {
    redirect("/login?next=/resume");
  }

  return <ResumePageClient />;
}
