import type { NavGroup, NavGroupAccent } from "@/lib/navigation-config";
import { NAV_GROUPS } from "@/lib/navigation-config";

export const NAV_ACCENT_STYLES: Record<
  NavGroupAccent,
  {
    triggerActive: string;
    triggerHover: string;
    panelBorder: string;
    panelHeader: string;
    iconBg: string;
    iconText: string;
    itemHover: string;
    itemActive: string;
    itemActiveIcon: string;
    mobileSection: string;
  }
> = {
  emerald: {
    triggerActive:
      "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80 shadow-sm",
    triggerHover: "hover:bg-emerald-50/70 hover:text-emerald-900",
    panelBorder: "border-emerald-100",
    panelHeader: "text-emerald-800",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    itemHover: "hover:bg-emerald-50 hover:border-emerald-100",
    itemActive: "bg-emerald-600 text-white shadow-sm border-emerald-600",
    itemActiveIcon: "bg-white/20 text-white",
    mobileSection: "border-emerald-200 bg-emerald-50/50",
  },
  sky: {
    triggerActive: "bg-sky-50 text-sky-900 ring-1 ring-sky-200/80 shadow-sm",
    triggerHover: "hover:bg-sky-50/70 hover:text-sky-900",
    panelBorder: "border-sky-100",
    panelHeader: "text-sky-800",
    iconBg: "bg-sky-100",
    iconText: "text-sky-700",
    itemHover: "hover:bg-sky-50 hover:border-sky-100",
    itemActive: "bg-sky-600 text-white shadow-sm border-sky-600",
    itemActiveIcon: "bg-white/20 text-white",
    mobileSection: "border-sky-200 bg-sky-50/50",
  },
  violet: {
    triggerActive:
      "bg-violet-50 text-violet-900 ring-1 ring-violet-200/80 shadow-sm",
    triggerHover: "hover:bg-violet-50/70 hover:text-violet-900",
    panelBorder: "border-violet-100",
    panelHeader: "text-violet-800",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
    itemHover: "hover:bg-violet-50 hover:border-violet-100",
    itemActive: "bg-violet-600 text-white shadow-sm border-violet-600",
    itemActiveIcon: "bg-white/20 text-white",
    mobileSection: "border-violet-200 bg-violet-50/50",
  },
};

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveNavGroup(pathname: string): NavGroup | undefined {
  return NAV_GROUPS.find((group) =>
    group.items.some((item) => isNavItemActive(pathname, item.href)),
  );
}

export function findActiveNavItem(pathname: string) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) =>
      isNavItemActive(pathname, entry.href),
    );
    if (item) {
      return { group, item };
    }
  }
  return undefined;
}

export function getAccentForPath(pathname: string): NavGroupAccent {
  return findActiveNavGroup(pathname)?.accent ?? "emerald";
}

export const PAGE_ACCENT_STYLES: Record<
  NavGroupAccent,
  {
    iconTile: string;
    headerBand: string;
    relatedLinkHover: string;
    emptyStateBg: string;
    sectionAccentBar: string;
    pillActive: string;
  }
> = {
  emerald: {
    iconTile:
      "bg-gradient-to-br from-emerald-600 to-emerald-950 text-white shadow-md shadow-emerald-900/30",
    headerBand: "bg-gradient-to-r from-emerald-50/80 to-teal-50/50",
    relatedLinkHover:
      "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800",
    emptyStateBg: "border-emerald-200/80 bg-emerald-50/40",
    sectionAccentBar: "bg-gradient-to-r from-emerald-600 to-teal-500",
    pillActive: "bg-emerald-600 text-white ring-emerald-600",
  },
  sky: {
    iconTile:
      "bg-gradient-to-br from-sky-500 to-indigo-800 text-white shadow-md shadow-sky-900/25",
    headerBand: "bg-gradient-to-r from-sky-50/80 to-cyan-50/50",
    relatedLinkHover:
      "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800",
    emptyStateBg: "border-sky-200/80 bg-sky-50/40",
    sectionAccentBar: "bg-gradient-to-r from-sky-600 to-cyan-500",
    pillActive: "bg-sky-600 text-white ring-sky-600",
  },
  violet: {
    iconTile:
      "bg-gradient-to-br from-violet-500 to-purple-900 text-white shadow-md shadow-violet-900/25",
    headerBand: "bg-gradient-to-r from-violet-50/80 to-purple-50/50",
    relatedLinkHover:
      "hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800",
    emptyStateBg: "border-violet-200/80 bg-violet-50/40",
    sectionAccentBar: "bg-gradient-to-r from-violet-600 to-purple-500",
    pillActive: "bg-violet-600 text-white ring-violet-600",
  },
};

export function getPageAccentStyles(accent: NavGroupAccent) {
  return PAGE_ACCENT_STYLES[accent];
}
