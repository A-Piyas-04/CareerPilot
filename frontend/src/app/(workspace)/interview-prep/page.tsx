import { redirect } from "next/navigation";

import { InterviewPrepPageClient } from "@/components/interview-prep/InterviewPrepPageClient";
import { createClient } from "@/lib/supabase/server";

export default async function InterviewPrepPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/interview-prep");
  }

  return <InterviewPrepPageClient />;
}
