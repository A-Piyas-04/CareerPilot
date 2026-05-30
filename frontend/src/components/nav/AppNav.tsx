"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { MobileNavDrawer, MobileNavTrigger } from "@/components/nav/MobileNavDrawer";
import { NavContextBar } from "@/components/nav/NavContextBar";
import { NavGroupMenu } from "@/components/nav/NavGroupMenu";
import { createClient } from "@/lib/supabase/client";
import { ALL_NAV_ITEMS, NAV_GROUPS } from "@/lib/navigation-config";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function toggleGroup(label: string) {
    setOpenGroup((current) => (current === label ? null : label));
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200/90 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1560px] items-center gap-3 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-2 transition hover:bg-zinc-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-sm shadow-emerald-900/15">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <span className="hidden text-sm font-bold tracking-tight text-zinc-900 sm:block">
              CareerPilot
            </span>
          </Link>

          <div className="hidden h-7 w-px shrink-0 bg-zinc-200 lg:block" />

          <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
            {NAV_GROUPS.map((group) => (
              <NavGroupMenu
                key={group.label}
                group={group}
                pathname={pathname}
                isOpen={openGroup === group.label}
                onToggle={() => toggleGroup(group.label)}
                onClose={() => setOpenGroup(null)}
              />
            ))}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <MobileNavTrigger onOpen={() => setMobileOpen(true)} />

            <button
              type="button"
              onClick={handleSignOut}
              className="hidden h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 hover:shadow-sm sm:inline-flex"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </div>

        <NavContextBar pathname={pathname} />
      </nav>

      <MobileNavDrawer
        isOpen={mobileOpen}
        pathname={pathname}
        onClose={() => setMobileOpen(false)}
        onSignOut={handleSignOut}
      />
    </>
  );
}

/** Flat list for mobile menus or tests */
export { ALL_NAV_ITEMS };
