import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { ContentPageSkeleton } from "@/components/ui/skeleton-layouts";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const supabase = await createClient();
  const user = await getServerUser(supabase, "chat page");

  if (!user) {
    redirect("/login?next=/chat");
  }

  return (
    <Suspense fallback={<ContentPageSkeleton variant="chat" />}>
      <ChatWorkspace />
    </Suspense>
  );
}
