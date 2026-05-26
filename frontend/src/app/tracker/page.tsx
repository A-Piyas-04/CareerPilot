import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { TrackerBoard } from "@/features/tracker/tracker-board";

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/tracker");
  }

  return <TrackerBoard />;
}
