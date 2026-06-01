import { redirect } from "next/navigation";

import { AppShell } from "@/components/nav/AppNav";
import { CoverLettersPageClient } from "@/components/cover-letters/CoverLettersPageClient";
import { createClient } from "@/lib/supabase/server";

export default async function CoverLettersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/cover-letters");
  }

  return (
    <AppShell>
      <CoverLettersPageClient />
    </AppShell>
  );
}
