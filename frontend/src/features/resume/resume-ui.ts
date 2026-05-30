/** Shared Tailwind class tokens for CV Intelligence UI — aligned with @/lib/ui-theme */

import {
  btnPrimary,
  btnPrimarySky,
  btnSecondary,
  chipAmber,
  chipEmerald,
  chipSky,
  inputField,
  premiumCard,
  surfaceCard,
  surfaceCardHeader,
  textareaField,
  textareaFieldSky,
} from "@/lib/ui-theme";

export {
  chipAmber,
  chipEmerald,
  chipSky,
  premiumCard,
  surfaceCard,
  surfaceCardHeader,
};

export const resumeCard = premiumCard;
export const resumeCardBody = "p-5";

export const resumeCardHeader = "text-base font-semibold text-zinc-950";
export const resumeCardSubtext = "mt-0.5 text-sm text-zinc-500";

export const resumePrimaryButton = `${btnPrimary} min-h-[44px]`;
export const resumeSecondaryButton = `${btnSecondary} min-h-[44px]`;

export const resumeAiButton = `${btnPrimarySky} min-h-[44px] w-full sm:w-auto sm:min-w-[160px]`;

export const resumeInput = `${inputField} h-11 disabled:bg-zinc-50 disabled:text-zinc-400`;
export const resumeTextarea = `${textareaField} disabled:bg-zinc-50 disabled:text-zinc-400`;
export const resumeAiTextarea = `${textareaFieldSky} disabled:bg-zinc-50 disabled:text-zinc-400`;

export const resumeOverlay = "fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-sm";

export const resumeDrawer =
  "ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-xl ring-1 ring-zinc-950/[0.05]";

export function resumeSegmentTab(active: boolean): string {
  return `flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
    active
      ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/60"
      : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
  }`;
}

export const resumeSegmentGroup =
  "flex gap-1 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-1 ring-1 ring-emerald-900/[0.04]";
