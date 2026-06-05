import { redirect } from "next/navigation";

import { GoalsWorkspace } from "@/features/goals/goals-workspace";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function GoalsPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "goals page");

  if (!user) {
    redirect("/login?next=/goals");
  }

  return <GoalsWorkspace />;
}
