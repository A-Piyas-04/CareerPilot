import { redirect } from "next/navigation";

import { AppNav } from "@/components/nav/AppNav";
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
    <>
      <AppNav />
      <CoverLettersPageClient />
    </>
  );
}
