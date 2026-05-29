import { redirect } from "next/navigation";

import { AppNav } from "@/components/nav/AppNav";
import { CoverLetterDetailClient } from "@/components/cover-letters/CoverLetterDetailClient";
import { createClient } from "@/lib/supabase/server";

type CoverLetterDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoverLetterDetailPage({
  params,
}: CoverLetterDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/cover-letters");
  }

  const { id } = await params;

  return (
    <>
      <AppNav />
      <CoverLetterDetailClient coverLetterId={id} />
    </>
  );
}
