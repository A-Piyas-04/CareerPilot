import { redirect } from "next/navigation";

import { AppNav } from "@/components/nav/AppNav";
import { TrackerBoard } from "@/features/tracker/tracker-board";
import { createClient } from "@/lib/supabase/server";

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/tracker");
  }

  return (
    <>
      <AppNav />
      <TrackerBoard />
    </>
  );
}
