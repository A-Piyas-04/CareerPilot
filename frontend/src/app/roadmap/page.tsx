import { redirect } from "next/navigation";

import { AppShell } from "@/components/nav/AppNav";
import { RoadmapPageClient } from "@/components/roadmap/RoadmapPageClient";
import { createClient } from "@/lib/supabase/server";

export default async function RoadmapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/roadmap");
  }

  return (
    <AppShell>
      <RoadmapPageClient />
    </AppShell>
  );
}
