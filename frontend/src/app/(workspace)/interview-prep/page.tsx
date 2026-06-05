import { redirect } from "next/navigation";

import { InterviewPrepPageClient } from "@/components/interview-prep/InterviewPrepPageClient";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function InterviewPrepPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "interview prep page");

  if (!user) {
    redirect("/login?next=/interview-prep");
  }

  return <InterviewPrepPageClient />;
}
