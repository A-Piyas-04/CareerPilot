import { redirect } from "next/navigation";

import { TrackerBoard } from "@/features/tracker/tracker-board";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TrackerPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "tracker page");

  if (!user) {
    redirect("/login?next=/tracker");
  }

  return <TrackerBoard />;
}
