/** Shared Tailwind class bundles for consistent UI across CareerPilot. */

import type { NavGroupAccent } from "@/lib/navigation-config";

export type AccentTone = NavGroupAccent;

/** Flat workspace canvas — matches CV Intelligence (`/resume`) page background */
export const workspacePageBackground = "bg-[var(--cp-workspace-main)]";

export const pageShell = `relative w-full flex-1 ${workspacePageBackground}`;

export const pageBackgroundDecor =
  "pointer-events-none absolute inset-0 overflow-hidden aria-hidden";

export const pageBackgroundBlob =
  "absolute rounded-full blur-3xl opacity-40";

export const pageContainer = "relative mx-auto w-full max-w-6xl px-5 py-6";
export const pageContainerWide = "relative mx-auto w-full max-w-[1400px] px-5 py-6";

export const surfaceCard =
  "rounded-2xl border border-[var(--cp-card-border)] bg-[var(--cp-card-bg)] text-[var(--cp-text-primary)] shadow-[0_2px_8px_-2px_rgb(var(--cp-shadow-color)/0.16)] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.04]";

export const surfaceCardMuted =
  "rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface-muted)] text-[var(--cp-text-secondary)] ring-1 ring-slate-900/[0.03] dark:ring-white/[0.04]";

export const surfaceCardElevated =
  "rounded-2xl border border-[var(--cp-card-border)] bg-[var(--cp-card-bg)] text-[var(--cp-text-primary)] shadow-[0_4px_16px_-4px_rgb(var(--cp-shadow-color)/0.22)] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.05]";

export const premiumCard =
  "rounded-3xl border border-emerald-900/10 bg-gradient-to-b from-white via-white to-emerald-50/40 shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-900/[0.06] backdrop-blur-sm transition-all duration-300 ease-out dark:border-emerald-300/15 dark:from-[var(--cp-card-bg)] dark:via-[var(--cp-card-bg)] dark:to-[var(--cp-primary-soft)] dark:shadow-black/30 dark:ring-emerald-300/10";

export const premiumCardHover =
  "hover:-translate-y-0.5 hover:border-emerald-600/20 hover:shadow-xl hover:shadow-emerald-900/15";

export const inputField =
  "h-10 w-full rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-raised)] px-3 text-sm text-[var(--cp-text-primary)] outline-none transition placeholder:text-[var(--cp-text-subtle)] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:border-emerald-300 dark:focus:ring-emerald-400/20";

export const textareaField =
  "w-full resize-y rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-raised)] px-3 py-2 text-sm text-[var(--cp-text-primary)] outline-none transition placeholder:text-[var(--cp-text-subtle)] focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:border-emerald-300 dark:focus:ring-emerald-400/20";

export const inputFieldSky =
  "h-10 w-full rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-raised)] px-3 text-sm text-[var(--cp-text-primary)] outline-none transition placeholder:text-[var(--cp-text-subtle)] focus:border-sky-600 focus:ring-2 focus:ring-sky-100 dark:focus:border-sky-300 dark:focus:ring-sky-400/20";

export const textareaFieldSky =
  "w-full resize-y rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface-raised)] px-3 py-2 text-sm text-[var(--cp-text-primary)] outline-none transition placeholder:text-[var(--cp-text-subtle)] focus:border-sky-600 focus:ring-2 focus:ring-sky-100 dark:focus:border-sky-300 dark:focus:ring-sky-400/20";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/15 ring-1 ring-emerald-700/20 transition hover:bg-emerald-800 disabled:opacity-60";

export const btnPrimaryGradient =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 ring-1 ring-emerald-700/30 transition hover:brightness-110 disabled:opacity-60";

export const btnPrimarySky =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 px-4 text-sm font-semibold text-white shadow-md shadow-sky-900/20 ring-1 ring-sky-600/30 transition hover:brightness-110 disabled:opacity-60";

export const btnSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 text-sm font-semibold text-[var(--cp-text-secondary)] transition hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)] disabled:opacity-60";

export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[var(--cp-text-muted)] transition hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)]";

export const btnDanger =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60";

export const eyebrow = "text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200";

export const pageTitle = "text-3xl font-semibold tracking-tight text-[var(--cp-text-primary)]";

export const pageDescription =
  "mt-1 max-w-3xl text-base leading-relaxed text-[var(--cp-text-muted)]";

export const chipEmerald =
  "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/60 dark:bg-emerald-400/12 dark:text-emerald-100 dark:ring-emerald-300/25";

export const chipSky =
  "rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-200/60 dark:bg-sky-400/12 dark:text-sky-100 dark:ring-sky-300/25";

export const chipViolet =
  "rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-violet-200/60 dark:bg-violet-400/12 dark:text-violet-100 dark:ring-violet-300/25";

export const chipAmber =
  "rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200/60 dark:bg-amber-400/12 dark:text-amber-100 dark:ring-amber-300/25";

export const chipRose =
  "rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-rose-200/60 dark:bg-rose-400/12 dark:text-rose-100 dark:ring-rose-300/25";

export const chipNeutral =
  "rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200/60 dark:bg-white/10 dark:text-slate-100 dark:ring-white/15";

export const badgeBase =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1";

export const badgeRag = `${badgeBase} bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-400/12 dark:text-emerald-100 dark:ring-emerald-300/25`;
export const badgeLiveSearch = `${badgeBase} bg-sky-50 text-sky-800 ring-sky-200/70 dark:bg-sky-400/12 dark:text-sky-100 dark:ring-sky-300/25`;
export const badgeFitScore = `${badgeBase} bg-gradient-to-r from-emerald-700 to-emerald-950 text-white ring-emerald-800/30`;
export const badgeAiGenerated = `${badgeBase} bg-violet-50 text-violet-800 ring-violet-200/70 dark:bg-violet-400/12 dark:text-violet-100 dark:ring-violet-300/25`;
export const badgeDeadline = `${badgeBase} bg-amber-50 text-amber-900 ring-amber-200/70 dark:bg-amber-400/12 dark:text-amber-100 dark:ring-amber-300/25`;
export const badgeInProgress = `${badgeBase} bg-sky-50 text-sky-800 ring-sky-200/70 dark:bg-sky-400/12 dark:text-sky-100 dark:ring-sky-300/25`;
export const badgeCompleted = `${badgeBase} bg-emerald-50 text-emerald-800 ring-emerald-200/70 dark:bg-emerald-400/12 dark:text-emerald-100 dark:ring-emerald-300/25`;

export const formPanel =
  "rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-card-bg)] p-5 text-[var(--cp-text-primary)] shadow-sm ring-1 ring-zinc-950/[0.03] dark:ring-white/[0.04]";

export const formHintPanel =
  "rounded-xl border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sm text-sky-900 dark:border-sky-300/25 dark:bg-sky-400/12 dark:text-sky-100";

export const formHintPanelEmerald =
  "rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-400/12 dark:text-emerald-100";

export const formHintPanelViolet =
  "rounded-xl border border-violet-200/80 bg-violet-50/80 px-4 py-3 text-sm text-violet-900 dark:border-violet-300/25 dark:bg-violet-400/12 dark:text-violet-100";

export const alertWarning =
  "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-300/25 dark:bg-amber-400/12 dark:text-amber-100";

export const alertError =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-300/25 dark:bg-red-400/12 dark:text-red-100";

export const alertInfo =
  "rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-300/25 dark:bg-sky-400/12 dark:text-sky-100";

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
    "rounded-t-2xl border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 px-5 py-3 dark:border-emerald-300/15 dark:from-emerald-400/12 dark:to-teal-400/8",
  sky: "rounded-t-2xl border-b border-sky-100/80 bg-gradient-to-r from-sky-50/90 to-cyan-50/60 px-5 py-3 dark:border-sky-300/15 dark:from-sky-400/12 dark:to-cyan-400/8",
  violet:
    "rounded-t-2xl border-b border-violet-100/80 bg-gradient-to-r from-violet-50/90 to-purple-50/60 px-5 py-3 dark:border-violet-300/15 dark:from-violet-400/12 dark:to-purple-400/8",
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
  return `inline-flex h-8 items-center rounded-full border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 text-xs font-medium text-[var(--cp-text-muted)] transition hover:bg-[var(--cp-surface-hover)] hover:text-[var(--cp-text-primary)] ${RELATED_LINK_HOVER[accent]}`;
}

export const nextActionStrip =
  "mt-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 px-4 py-3 dark:border-emerald-300/20 dark:from-emerald-400/12 dark:to-teal-400/8";

export const forestGradient =
  "bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950";
