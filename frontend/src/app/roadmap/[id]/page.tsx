import { redirect } from "next/navigation";

import { AppNav } from "@/components/nav/AppNav";
import { RoadmapDetailClient } from "@/components/roadmap/RoadmapDetailClient";
import { createClient } from "@/lib/supabase/server";

type RoadmapDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoadmapDetailPage({
  params,
}: RoadmapDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/roadmap");
  }

  const { id } = await params;

  return (
    <>
      <AppNav />
      <RoadmapDetailClient roadmapId={id} />
    </>
  );
}
