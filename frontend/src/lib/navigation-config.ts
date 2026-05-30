import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LineChart,
  Mail,
  Map,
  MessageSquareText,
  Sparkles,
  Target,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  shortLabel?: string;
  description?: string;
};

export type NavGroupAccent = "emerald" | "sky" | "violet";

export type NavGroup = {
  label: string;
  description: string;
  accent: NavGroupAccent;
  items: NavItem[];
};

export type RelatedLink = {
  href: string;
  label: string;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Discover",
    description: "Find roles and understand your CV",
    accent: "emerald",
    items: [
      {
        href: "/jobs",
        label: "Job Hunter",
        shortLabel: "Jobs",
        icon: Sparkles,
        description: "Search and score job matches",
      },
      {
        href: "/resume",
        label: "CV Intelligence",
        shortLabel: "CV",
        icon: FileText,
        description: "Upload, edit, and query your CV",
      },
      {
        href: "/chat",
        label: "Assistant",
        shortLabel: "Chat",
        icon: MessageSquareText,
        description: "CV-grounded career chat",
      },
    ],
  },
  {
    label: "Plan",
    description: "Analyze gaps and prepare applications",
    accent: "sky",
    items: [
      {
        href: "/skill-gap",
        label: "Skill Gap",
        shortLabel: "Gaps",
        icon: LineChart,
        description: "Compare skills to a target role",
      },
      {
        href: "/roadmap",
        label: "Roadmap",
        shortLabel: "Plan",
        icon: Map,
        description: "Weekly learning plans",
      },
      {
        href: "/cover-letters",
        label: "Cover Letters",
        shortLabel: "Letters",
        icon: Mail,
        description: "Generate tailored letters",
      },
    ],
  },
  {
    label: "Track",
    description: "Manage applications and progress",
    accent: "violet",
    items: [
      {
        href: "/tracker",
        label: "Tracker",
        shortLabel: "Track",
        icon: BriefcaseBusiness,
        description: "Kanban application board",
      },
      {
        href: "/goals",
        label: "Goals",
        shortLabel: "Goals",
        icon: Target,
        description: "Milestones and linked tasks",
      },
      {
        href: "/calendar",
        label: "Calendar",
        shortLabel: "Cal",
        icon: CalendarDays,
        description: "Deadlines and events",
      },
      {
        href: "/dashboard",
        label: "Dashboard",
        shortLabel: "Dash",
        icon: LayoutDashboard,
        description: "Metrics and AI nudges",
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export const PAGE_RELATED_LINKS: Record<string, RelatedLink[]> = {
  "/jobs": [
    { href: "/resume", label: "Upload CV" },
    { href: "/tracker", label: "Tracker" },
    { href: "/cover-letters", label: "Cover letters" },
  ],
  "/resume": [
    { href: "/jobs", label: "Search jobs" },
    { href: "/chat", label: "Ask assistant" },
    { href: "/skill-gap", label: "Skill gap" },
  ],
  "/chat": [
    { href: "/jobs", label: "Job Hunter" },
    { href: "/resume", label: "CV" },
    { href: "/roadmap", label: "Roadmap" },
  ],
  "/skill-gap": [
    { href: "/jobs", label: "Job Hunter" },
    { href: "/roadmap", label: "Build roadmap" },
    { href: "/resume", label: "Update CV" },
  ],
  "/roadmap": [
    { href: "/skill-gap", label: "Skill gap" },
    { href: "/goals", label: "Goals & tasks" },
    { href: "/calendar", label: "Calendar" },
  ],
  "/cover-letters": [
    { href: "/jobs", label: "Job Hunter" },
    { href: "/resume", label: "CV" },
    { href: "/tracker", label: "Tracker" },
  ],
  "/tracker": [
    { href: "/jobs", label: "Find jobs" },
    { href: "/calendar", label: "Calendar" },
    { href: "/cover-letters", label: "Cover letters" },
  ],
  "/goals": [
    { href: "/calendar", label: "Calendar" },
    { href: "/tracker", label: "Tracker" },
    { href: "/dashboard", label: "Dashboard" },
  ],
  "/calendar": [
    { href: "/goals", label: "Goals" },
    { href: "/tracker", label: "Tracker" },
    { href: "/roadmap", label: "Roadmap" },
  ],
  "/dashboard": [
    { href: "/jobs", label: "Job Hunter" },
    { href: "/tracker", label: "Tracker" },
    { href: "/goals", label: "Goals" },
  ],
};

export function getRelatedLinks(pathname: string): RelatedLink[] {
  const base = ALL_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.href;

  if (!base) return [];
  return PAGE_RELATED_LINKS[base] ?? [];
}
