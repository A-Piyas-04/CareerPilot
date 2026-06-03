/** Shared Tailwind tokens — business HR dashboard with clear surface hierarchy */

import {
  btnPrimaryGradient,
  btnSecondary,
  inputField,
  textareaField,
} from "@/lib/ui-theme";

/** Align all page sections to the same width as PageShell (max-w-6xl) */
export const resumePageStack = "w-full space-y-6";

const btnMotion =
  "transition-all duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:active:scale-100";

/** Page canvas (cards sit on top of this) */
export const resumePageCanvas = "bg-[var(--cp-workspace-main)]";

/** Primary workspace shell: active resume + upload/build/manual */
export const resumeWorkspaceShell =
  "overflow-hidden rounded-xl border border-[var(--cp-card-border)] bg-[var(--cp-card-bg)] shadow-[0_4px_24px_-4px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/6";

export const resumeWorkspaceBand =
  "relative border-b border-emerald-900/10 bg-gradient-to-br from-emerald-50/70 via-slate-50 to-white px-5 py-5 sm:px-6 sm:py-6";

/** Frosted card inside the workspace band (active resume picker) */
export const resumeActiveBarPanel =
  "relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_4px_24px_-6px_rgba(4,120,87,0.18)] ring-1 ring-emerald-900/[0.06] backdrop-blur-md sm:flex-row sm:items-center sm:gap-5 sm:p-5";

export const resumeActiveBarIcon =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-900/25 ring-2 ring-white/60";

export const resumeWorkspaceBody = "bg-white px-5 py-5 sm:px-8 sm:py-6";

/** Standalone cards (overview, ask AI, footer) on the page canvas */
export const resumePageCard =
  "rounded-xl border border-[var(--cp-card-border)] bg-[var(--cp-card-bg)] shadow-[0_2px_12px_-2px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.05]";

export const resumeCardBody = "p-5 sm:p-6";

export const resumeCardHeader =
  "border-b border-zinc-200 pb-3 text-base font-semibold tracking-tight text-zinc-900";

export const resumeModuleTitle = "text-base font-semibold text-zinc-900";
export const resumeCardSubtext = "mt-1 text-sm leading-relaxed text-zinc-600";

/** Emphasized values (filename, stat numbers, labels) */
export const resumeEmphasis = "font-semibold text-zinc-900";
export const resumeFileName =
  "font-semibold tracking-tight text-emerald-900";
export const resumeStatValue = "text-base font-bold tabular-nums text-zinc-900";

export const resumePrimaryButton = `${btnPrimaryGradient} min-h-[44px] ${btnMotion} hover:shadow-lg hover:shadow-emerald-900/25 active:shadow-sm`;

export const resumeSecondaryButton = `${btnSecondary} min-h-[40px] ${btnMotion} hover:border-zinc-400 hover:shadow-sm active:bg-zinc-100`;

export const resumeAiButton = `inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/15 ring-1 ring-emerald-900/20 ${btnMotion} hover:bg-emerald-900 hover:shadow-md disabled:opacity-60 disabled:shadow-none sm:min-w-[140px]`;

export const resumeInput = `${inputField} h-10 border-zinc-300 bg-white disabled:bg-zinc-100 disabled:text-zinc-400`;
export const resumeTextarea = `${textareaField} border-zinc-300 bg-white disabled:bg-zinc-100 disabled:text-zinc-400`;
export const resumeAiTextarea = `${textareaField} min-h-[96px] border-zinc-300 bg-white`;

export const resumeSelect =
  "h-11 w-full cursor-pointer rounded-xl border border-emerald-200/80 bg-white px-3.5 pr-10 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all duration-150 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100/80 hover:border-emerald-400/80 hover:shadow-md";

export function resumeSegmentTab(active: boolean): string {
  return `relative z-10 flex flex-1 min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-sm transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 sm:flex-row sm:gap-2 sm:px-3 ${
    active
      ? "font-semibold text-emerald-900"
      : "font-medium text-zinc-500 hover:text-emerald-800"
  }`;
}

/** Sliding pill behind segment tabs (position via inline transform) */
export const resumeSegmentIndicator =
  "pointer-events-none absolute top-1 bottom-1 left-1 rounded-xl bg-white shadow-[0_2px_8px_-2px_rgba(4,120,87,0.35)] ring-1 ring-emerald-600/20 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform";

export function resumePromptChip(active: boolean): string {
  return `rounded-full border px-3 py-1.5 text-left text-xs font-medium ${btnMotion} ${
    active
      ? "border-emerald-700 bg-emerald-800 text-white shadow-md shadow-emerald-900/15 ring-1 ring-emerald-900/20"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-900"
  }`;
}

export const resumeSegmentGroup =
  "relative flex gap-1 rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-1 shadow-inner shadow-zinc-900/[0.04]";

export const resumeDropZoneBase =
  "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-4 py-12 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2";

export const resumeDropZoneIdle =
  `${resumeDropZoneBase} cp-upload-drop-idle border-zinc-300/90 bg-white hover:border-emerald-500/70 hover:bg-emerald-50/30 hover:shadow-[0_8px_30px_-12px_rgba(4,120,87,0.35)] active:scale-[0.995]`;

export const resumeDropZoneActive =
  "scale-[1.01] border-emerald-500 bg-emerald-50/80 shadow-[0_12px_40px_-14px_rgba(4,120,87,0.45)] ring-2 ring-emerald-400/30";

export const resumeDropZoneFile =
  "border-emerald-500/80 bg-gradient-to-b from-emerald-50 to-white shadow-md ring-1 ring-emerald-600/15";

export const resumeFileTypePill =
  "rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500";

export const resumeInsetPanel =
  "rounded-xl border border-zinc-200/80 bg-slate-50/80 ring-1 ring-zinc-900/[0.03] transition-colors duration-150";

export const resumeStatCard =
  "rounded-lg border border-zinc-300 bg-slate-50 px-3 py-2.5 shadow-sm transition-all duration-150 hover:border-emerald-600/40 hover:bg-white hover:shadow-sm";

export const resumeSectionRow =
  "rounded-lg border border-zinc-300 bg-slate-50 transition-all duration-150 hover:border-zinc-400 hover:bg-white hover:shadow-sm";

export const resumeDangerButton = `inline-flex min-h-[36px] items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-800 ${btnMotion} hover:border-red-400 hover:bg-red-50 hover:shadow-sm`;

export const resumeOverlay = "fixed inset-0 z-40 bg-zinc-950/40";

export const resumeDrawer =
  "ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl ring-1 ring-zinc-950/[0.08]";
