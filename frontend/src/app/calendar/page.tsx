import { redirect } from "next/navigation";

import { AppNav } from "@/components/nav/AppNav";
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

  return (
    <>
      <AppNav />
      <CalendarView />
    </>
  );
}
