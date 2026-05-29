"use client";

import {
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  Mail,
  Map,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/tracker",
    label: "Job Tracker",
    icon: BriefcaseBusiness,
  },
  {
    href: "/jobs",
    label: "Job Hunter",
    icon: Sparkles,
  },
  {
    href: "/resume",
    label: "CV Intelligence",
    icon: FileText,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: Target,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/roadmap",
    label: "Roadmap",
    icon: Map,
  },
  {
    href: "/cover-letters",
    label: "Cover Letters",
    icon: Mail,
  },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 px-4 py-2 bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-sm">
      {/* Brand */}
      <Link
        href="/tracker"
        className="flex items-center gap-1.5 mr-4 shrink-0"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700">
          <LayoutDashboard className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-zinc-900 tracking-tight hidden sm:block">
          CareerPilot
        </span>
      </Link>

      {/* Divider */}
      <div className="h-5 w-px bg-zinc-200 mr-3 hidden sm:block" />

      {/* Nav links */}
      <div className="flex items-center gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
