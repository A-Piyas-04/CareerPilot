/** Shared Tailwind class tokens for CV Intelligence UI */

export const resumeCard =
  "rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm ring-1 ring-zinc-950/5";

export const resumeCardHeader = "text-base font-semibold text-zinc-950";
export const resumeCardSubtext = "mt-0.5 text-sm text-zinc-500";

export const resumePrimaryButton =
  "flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55";

export const resumeSecondaryButton =
  "flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition duration-200 hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-55";

export const resumeAiButton =
  "flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:min-w-[160px]";

export const resumeInput =
  "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-50 disabled:text-zinc-400";

export const resumeTextarea =
  "w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-zinc-50 disabled:text-zinc-400";

export const resumeAiTextarea =
  "w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition duration-200 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 disabled:bg-zinc-50 disabled:text-zinc-400";

export const resumeOverlay = "fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-sm";

export const resumeDrawer =
  "ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl";

export function resumeSegmentTab(active: boolean): string {
  return `flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
    active
      ? "bg-white text-emerald-800 shadow-sm ring-1 ring-zinc-200/80"
      : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
  }`;
}

export const resumeSegmentGroup =
  "flex gap-1 rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-1 ring-1 ring-zinc-950/5";
