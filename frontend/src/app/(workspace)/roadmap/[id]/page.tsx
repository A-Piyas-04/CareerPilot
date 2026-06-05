import { redirect } from "next/navigation";

import { RoadmapDetailClient } from "@/components/roadmap/RoadmapDetailClient";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

type RoadmapDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoadmapDetailPage({
  params,
}: RoadmapDetailPageProps) {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "roadmap detail page");

  if (!user) {
    redirect("/login?next=/roadmap");
  }

  const { id } = await params;

  return <RoadmapDetailClient roadmapId={id} />;
}
