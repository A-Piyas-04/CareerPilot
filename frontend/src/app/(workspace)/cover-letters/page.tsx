import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CoverLettersPageClient } from "@/components/cover-letters/CoverLettersPageClient";
import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CoverLettersPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "cover letters page");

  if (!user) {
    redirect("/login?next=/cover-letters");
  }

  return (
    <Suspense fallback={<ContentPageSkeleton variant="twoColumn" />}>
      <CoverLettersPageClient />
    </Suspense>
  );
}
