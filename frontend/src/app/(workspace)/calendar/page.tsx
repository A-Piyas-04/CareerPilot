import { redirect } from "next/navigation";

import { CalendarView } from "@/components/calendar/CalendarView";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "calendar page");

  if (!user) {
    redirect("/login?next=/calendar");
  }

  return <CalendarView />;
}
