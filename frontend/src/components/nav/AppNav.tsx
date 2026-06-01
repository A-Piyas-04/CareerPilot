"use client";

import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Map,
  Menu,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { IconButton } from "@/components/ui";
import { cn } from "@/components/ui/cn";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Progress cockpit",
    icon: LayoutDashboard,
  },
  {
    href: "/tracker",
    label: "Tracker",
    description: "Kanban pipeline",
    icon: BriefcaseBusiness,
  },
  {
    href: "/jobs",
    label: "Jobs",
    description: "Search and match",
    icon: Search,
  },
  {
    href: "/resume",
    label: "CV Intelligence",
    description: "Parse and ask",
    icon: FileText,
  },
  {
    href: "/goals",
    label: "Goals",
    description: "Tasks and outcomes",
    icon: Target,
  },
  {
    href: "/calendar",
    label: "Calendar",
    description: "Deadlines and plans",
    icon: CalendarDays,
  },
  {
    href: "/roadmap",
    label: "Roadmap",
    description: "Learning plans",
    icon: Map,
  },
  {
    href: "/cover-letters",
    label: "Letters",
    description: "Tailored drafts",
    icon: Mail,
  },
  {
    href: "/chat",
    label: "Assistant",
    description: "Career chat",
    icon: Bot,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className="group flex min-w-0 items-center gap-3 rounded-2xl p-1.5 transition hover:bg-[var(--surface-subtle)]"
      href="/dashboard"
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(84,214,182,0.45),transparent_42%),radial-gradient(circle_at_76%_82%,rgba(138,163,255,0.5),transparent_44%)]" />
        <Sparkles className="relative h-5 w-5" />
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold tracking-tight text-[var(--foreground)]">
            CareerPilot
          </span>
          <span className="block truncate text-xs font-medium text-[var(--muted-foreground)]">
            Career command center
          </span>
        </span>
      )}
    </Link>
  );
}

function NavigationList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1.5" aria-label="Workspace navigation">
      {NAV_ITEMS.map(({ description, href, icon: Icon, label }) => {
        const active = isActivePath(pathname, href);

        return (
          <Link
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition duration-200 cp-focus",
              active
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-[var(--shadow-soft)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
            )}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                active
                  ? "bg-[var(--background)]/12 text-[var(--background)]"
                  : "bg-[var(--surface-raised)] text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{label}</span>
              <span
                className={cn(
                  "block truncate text-xs",
                  active
                    ? "text-[var(--background)]/70"
                    : "text-[var(--muted)]",
                )}
              >
                {description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="mt-auto space-y-4">
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-glass)] p-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
          Focus mode
        </p>
        <p className="mt-2 text-sm leading-5 text-[var(--muted-foreground)]">
          Keep the next best action visible across your career search.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <ThemeToggle compact />
        <IconButton label="Sign out" onClick={onSignOut}>
          <LogOut className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--nav-width)] border-r border-[var(--border)] bg-[var(--surface-glass)] px-4 py-5 shadow-[var(--shadow-soft)] backdrop-blur-2xl lg:flex lg:flex-col">
        <BrandMark />
        <div className="mt-6">
          <NavigationList />
        </div>
        <SidebarFooter onSignOut={handleSignOut} />
      </aside>

      <div className="min-h-screen lg:pl-[var(--nav-width)]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-glass)] px-4 backdrop-blur-2xl lg:hidden">
          <BrandMark compact />
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <IconButton label="Open navigation" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </IconButton>
          </div>
        </header>

        <main className="min-h-screen">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            type="button"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(88vw,360px)] flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 shadow-[var(--shadow-strong)]">
            <div className="flex items-center justify-between gap-3">
              <BrandMark />
              <IconButton
                label="Close navigation"
                variant="ghost"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </IconButton>
            </div>
            <div className="mt-6">
              <NavigationList onNavigate={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter onSignOut={handleSignOut} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export function AppNav() {
  return null;
}
