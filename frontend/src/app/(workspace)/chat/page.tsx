import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/chat");
  }

  return (
    <Suspense fallback={<ContentPageSkeleton variant="chat" />}>
      <ChatWorkspace />
    </Suspense>
  );
}
