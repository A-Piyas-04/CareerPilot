import { redirect } from "next/navigation";

import { CoverLetterDetailClient } from "@/components/cover-letters/CoverLetterDetailClient";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

type CoverLetterDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoverLetterDetailPage({
  params,
}: CoverLetterDetailPageProps) {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "cover letter detail page");

  if (!user) {
    redirect("/login?next=/cover-letters");
  }

  const { id } = await params;

  return <CoverLetterDetailClient coverLetterId={id} />;
}
