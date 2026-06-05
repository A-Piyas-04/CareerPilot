import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SkillGapPageClient } from "@/features/skill-gap/skill-gap-page-client";
import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SkillGapPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "skill gap page");

  if (!user) {
    redirect("/login?next=/skill-gap");
  }

  return (
    <Suspense fallback={<ContentPageSkeleton variant="twoColumn" />}>
      <SkillGapPageClient />
    </Suspense>
  );
}
