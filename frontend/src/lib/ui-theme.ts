/** Shared Tailwind class bundles for consistent UI across CareerPilot. */

export const pageShell =
  "min-h-[calc(100vh-var(--cp-nav-height))] bg-[var(--cp-page-bg)] lg:min-h-[calc(100vh-var(--cp-nav-with-context))]";

export const pageContainer = "mx-auto w-full max-w-6xl px-5 py-6";
export const pageContainerWide = "mx-auto w-full max-w-[1400px] px-5 py-6";

export const surfaceCard =
  "rounded-xl border border-zinc-200/90 bg-white shadow-sm";

export const surfaceCardMuted =
  "rounded-xl border border-zinc-200/80 bg-zinc-50/80";

export const inputField =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export const textareaField =
  "w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60";

export const btnSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60";

export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900";

export const eyebrow = "text-xs font-semibold uppercase tracking-wide text-emerald-700";

export const pageTitle = "text-2xl font-semibold tracking-tight text-zinc-950";

export const pageDescription = "mt-1 max-w-3xl text-sm leading-6 text-zinc-600";

export const chipEmerald =
  "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800";

export const chipSky =
  "rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800";

export const alertWarning =
  "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900";

export const alertError =
  "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

export const alertInfo =
  "rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900";
