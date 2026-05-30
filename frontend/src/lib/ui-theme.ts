/** Shared Tailwind class bundles for consistent UI across CareerPilot. */

import type { NavGroupAccent } from "@/lib/navigation-config";

export type AccentTone = NavGroupAccent;

export const pageShell =
  "relative min-h-[calc(100vh-var(--cp-nav-height))] bg-gradient-to-b from-emerald-50/30 via-[var(--cp-page-bg)] to-sky-50/20 lg:min-h-[calc(100vh-var(--cp-nav-with-context))]";

export const pageBackgroundDecor =
  "pointer-events-none absolute inset-0 overflow-hidden aria-hidden";

export const pageBackgroundBlob =
  "absolute rounded-full blur-3xl opacity-40";

export const pageContainer = "relative mx-auto w-full max-w-6xl px-5 py-6";
export const pageContainerWide = "relative mx-auto w-full max-w-[1400px] px-5 py-6";

export const surfaceCard =
  "rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]";

export const surfaceCardMuted =
  "rounded-2xl border border-zinc-200/80 bg-zinc-50/80 ring-1 ring-zinc-950/[0.02]";

export const surfaceCardElevated =
  "rounded-2xl border border-zinc-200/90 bg-white shadow-md ring-1 ring-zinc-950/[0.04]";

export const premiumCard =
  "rounded-3xl border border-emerald-900/10 bg-gradient-to-b from-white via-white to-emerald-50/40 shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-900/[0.06] backdrop-blur-sm transition-all duration-300 ease-out";

export const premiumCardHover =
  "hover:-translate-y-0.5 hover:border-emerald-600/20 hover:shadow-xl hover:shadow-emerald-900/15";

export const inputField =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export const textareaField =
  "w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export const inputFieldSky =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

export const textareaFieldSky =
  "w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/15 ring-1 ring-emerald-700/20 transition hover:bg-emerald-800 disabled:opacity-60";

export const btnPrimaryGradient =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-700/30 transition hover:brightness-110 disabled:opacity-60";

export const btnPrimarySky =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 px-4 text-sm font-semibold text-white shadow-md shadow-sky-900/20 ring-1 ring-sky-600/30 transition hover:brightness-110 disabled:opacity-60";

export const btnSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60";

export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900";

export const btnDanger =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60";

export const eyebrow = "text-xs font-semibold uppercase tracking-wide text-emerald-700";

export const pageTitle = "text-2xl font-semibold tracking-tight text-zinc-950";

export const pageDescription = "mt-1 max-w-3xl text-sm leading-6 text-zinc-600";

export const chipEmerald =
  "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/60";

export const chipSky =
  "rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200/60";

export const chipViolet =
  "rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-violet-200/60";

export const chipAmber =
  "rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200/60";

export const chipNeutral =
  "rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200/60";

export const badgeBase =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1";

export const badgeRag = `${badgeBase} bg-emerald-50 text-emerald-800 ring-emerald-200/70`;
export const badgeLiveSearch = `${badgeBase} bg-sky-50 text-sky-800 ring-sky-200/70`;
export const badgeFitScore = `${badgeBase} bg-gradient-to-r from-emerald-700 to-emerald-950 text-white ring-emerald-800/30`;
export const badgeAiGenerated = `${badgeBase} bg-violet-50 text-violet-800 ring-violet-200/70`;
export const badgeDeadline = `${badgeBase} bg-amber-50 text-amber-900 ring-amber-200/70`;
export const badgeInProgress = `${badgeBase} bg-sky-50 text-sky-800 ring-sky-200/70`;
export const badgeCompleted = `${badgeBase} bg-emerald-50 text-emerald-800 ring-emerald-200/70`;

export const formPanel =
  "rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/[0.03]";

export const formHintPanel =
  "rounded-xl border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sm text-sky-900";

export const formHintPanelEmerald =
  "rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900";

export const formHintPanelViolet =
  "rounded-xl border border-violet-200/80 bg-violet-50/80 px-4 py-3 text-sm text-violet-900";

export const alertWarning =
  "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900";

export const alertError =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

export const alertInfo =
  "rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900";

const ICON_TILE: Record<AccentTone, string> = {
  emerald:
    "bg-gradient-to-br from-emerald-600 to-emerald-950 text-white shadow-md shadow-emerald-900/30",
  sky: "bg-gradient-to-br from-sky-500 to-indigo-800 text-white shadow-md shadow-sky-900/25",
  violet:
    "bg-gradient-to-br from-violet-500 to-purple-900 text-white shadow-md shadow-violet-900/25",
};

export function iconTile(accent: AccentTone = "emerald"): string {
  return ICON_TILE[accent];
}

const SURFACE_HEADER: Record<AccentTone, string> = {
  emerald:
    "rounded-t-2xl border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 px-5 py-3",
  sky: "rounded-t-2xl border-b border-sky-100/80 bg-gradient-to-r from-sky-50/90 to-cyan-50/60 px-5 py-3",
  violet:
    "rounded-t-2xl border-b border-violet-100/80 bg-gradient-to-r from-violet-50/90 to-purple-50/60 px-5 py-3",
};

export function surfaceCardHeader(accent: AccentTone = "emerald"): string {
  return SURFACE_HEADER[accent];
}

export function fitScoreBadge(tier: "high" | "medium" | "low"): string {
  if (tier === "high") {
    return `${badgeBase} bg-gradient-to-r from-emerald-700 to-emerald-950 text-white ring-emerald-800/30`;
  }
  if (tier === "medium") {
    return `${badgeBase} bg-gradient-to-r from-sky-600 to-sky-800 text-white ring-sky-700/30`;
  }
  return `${badgeBase} bg-gradient-to-r from-amber-500 to-amber-700 text-white ring-amber-600/30`;
}

const RELATED_LINK_HOVER: Record<AccentTone, string> = {
  emerald:
    "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800",
  sky: "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800",
  violet:
    "hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800",
};

export function relatedLinkPill(accent: AccentTone = "emerald"): string {
  return `inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition ${RELATED_LINK_HOVER[accent]}`;
}

export const nextActionStrip =
  "mt-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 px-4 py-3";

export const forestGradient =
  "bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950";
