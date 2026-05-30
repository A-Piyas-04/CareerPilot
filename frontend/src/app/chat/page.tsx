import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppNav } from "@/components/nav/AppNav";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
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
    <>
      <AppNav />
      <Suspense fallback={null}>
        <ChatWorkspace />
      </Suspense>
    </>
  );
}
