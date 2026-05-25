import { redirect } from "next/navigation";

import { CalendarView } from "@/components/calendar/CalendarView";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/calendar");
  }

  return <CalendarView />;
}
