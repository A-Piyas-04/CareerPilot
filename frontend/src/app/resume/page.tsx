import { redirect } from "next/navigation";

import { AppNav } from "@/components/nav/AppNav";
import { ResumePageClient } from "@/features/resume/resume-page-client";
import { createClient } from "@/lib/supabase/server";

export default async function ResumePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/resume");
  }

  return (
    <>
      <AppNav />
      <ResumePageClient />
    </>
  );
}
