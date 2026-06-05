import { redirect } from "next/navigation";

import { DashboardPageClient } from "@/components/dashboard/DashboardPageClient";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "dashboard page");

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return <DashboardPageClient />;
}
