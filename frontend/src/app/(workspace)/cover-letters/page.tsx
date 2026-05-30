import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CoverLettersPageClient } from "@/components/cover-letters/CoverLettersPageClient";
import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import { createClient } from "@/lib/supabase/server";

export default async function CoverLettersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/cover-letters");
  }

  return (
    <Suspense fallback={<ContentPageSkeleton variant="twoColumn" />}>
      <CoverLettersPageClient />
    </Suspense>
  );
}
