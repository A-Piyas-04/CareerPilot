import { redirect } from "next/navigation";

import { EvidenceMapPageClient } from "@/features/jobs/evidence-map/EvidenceMapPageClient";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

type EvidenceMapPageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function EvidenceMapPage({ params }: EvidenceMapPageProps) {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "evidence map page");

  if (!user) {
    redirect("/login?next=/jobs");
  }

  const { matchId } = await params;

  return <EvidenceMapPageClient matchId={matchId} />;
}
