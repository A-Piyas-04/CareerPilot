"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  MobileNavDrawer,
  MobileNavTrigger,
} from "@/components/nav/MobileNavDrawer";
import { TransitionLink } from "@/components/navigation/navigation-transition";
import { suppressExtensionHydrationProps } from "@/lib/hydration";
import { DASHBOARD_NAV_ITEM } from "@/lib/navigation-config";
import { isNavItemActive } from "@/lib/nav-styles";
import { createClient } from "@/lib/supabase/client";

export function AppTopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardActive = isNavItemActive(
    pathname,
    DASHBOARD_NAV_ITEM.href,
  );
  const DashboardIcon = DASHBOARD_NAV_ITEM.icon;

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[var(--cp-header-height)] shrink-0 items-center gap-3 border-b border-[var(--cp-header-border)] bg-[var(--cp-header-bg)] px-4 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_4px_12px_-2px_rgba(15,23,42,0.06)]">
        <MobileNavTrigger onOpen={() => setMobileOpen(true)} />

        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-xl py-1 pr-2 transition hover:bg-zinc-50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-md shadow-emerald-900/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="truncate text-lg font-bold tracking-tight text-zinc-900">
            CareerPilot
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <TransitionLink
            href={DASHBOARD_NAV_ITEM.href}
            aria-current={dashboardActive ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold transition-all duration-150 sm:px-3.5 ${
              dashboardActive
                ? "bg-violet-600 text-white shadow-sm ring-1 ring-violet-700/30"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900"
            }`}
          >
            <DashboardIcon className="h-4 w-4" />
            <span className="hidden min-[420px]:inline">
              {DASHBOARD_NAV_ITEM.label}
            </span>
            <span className="sr-only min-[420px]:hidden">
              {DASHBOARD_NAV_ITEM.label}
            </span>
          </TransitionLink>

          <button
            {...suppressExtensionHydrationProps}
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3.5 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </header>

      <MobileNavDrawer
        isOpen={mobileOpen}
        pathname={pathname}
        onClose={() => setMobileOpen(false)}
        onSignOut={handleSignOut}
      />
    </>
  );
}
