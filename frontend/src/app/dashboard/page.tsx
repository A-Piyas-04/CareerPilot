import { redirect } from "next/navigation";

import { DashboardPageClient } from "@/components/dashboard/DashboardPageClient";
import { AppNav } from "@/components/nav/AppNav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <>
      <AppNav />
      <DashboardPageClient />
    </>
  );
}
