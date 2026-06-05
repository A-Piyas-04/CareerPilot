import { redirect } from "next/navigation";
import { Suspense } from "react";

import { RoadmapPageClient } from "@/components/roadmap/RoadmapPageClient";
import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function RoadmapPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "roadmap page");

  if (!user) {
    redirect("/login?next=/roadmap");
  }

  return (
    <Suspense fallback={<ContentPageSkeleton variant="twoColumn" />}>
      <RoadmapPageClient />
    </Suspense>
  );
}
