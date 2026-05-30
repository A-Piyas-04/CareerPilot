import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppNav } from "@/components/nav/AppNav";
import { SkillGapPageClient } from "@/features/skill-gap/skill-gap-page-client";
import { createClient } from "@/lib/supabase/server";

export default async function SkillGapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/skill-gap");
  }

  return (
    <>
      <AppNav />
      <Suspense fallback={null}>
        <SkillGapPageClient />
      </Suspense>
    </>
  );
}
