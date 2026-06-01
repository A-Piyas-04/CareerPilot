import { redirect } from "next/navigation";

import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { AppShell } from "@/components/nav/AppNav";
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
    <AppShell>
      <ChatWorkspace />
    </AppShell>
  );
}
