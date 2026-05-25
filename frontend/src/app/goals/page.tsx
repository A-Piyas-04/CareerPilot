import { redirect } from "next/navigation";

import { GoalsWorkspace } from "@/features/goals/goals-workspace";
import { createClient } from "@/lib/supabase/server";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/goals");
  }

  return <GoalsWorkspace />;
}
