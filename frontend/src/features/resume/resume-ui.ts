/** Shared Tailwind class tokens for CV Intelligence UI */

export const resumeCard =
  "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-glass)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl";

export const resumeCardHeader = "text-base font-semibold text-[var(--foreground)]";
export const resumeCardSubtext = "mt-0.5 text-sm text-[var(--muted-foreground)]";

export const resumePrimaryButton =
  "flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:opacity-55";

export const resumeSecondaryButton =
  "flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-sm font-semibold text-[var(--foreground)] transition duration-200 hover:bg-[var(--surface-subtle)] disabled:opacity-55";

export const resumeAiButton =
  "flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition duration-200 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto sm:min-w-[160px]";

export const resumeInput =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--foreground)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]";

export const resumeTextarea =
  "w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]";

export const resumeAiTextarea =
  "w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition duration-200 placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)] disabled:bg-[var(--surface-subtle)] disabled:text-[var(--muted)]";

export const resumeOverlay = "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm";

export const resumeDrawer =
  "ml-auto flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-strong)]";

export function resumeSegmentTab(active: boolean): string {
  return `flex flex-1 min-h-[44px] items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] ${
    active
      ? "bg-[var(--surface-raised)] text-[var(--foreground)] shadow-sm ring-1 ring-[var(--border)]"
      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
  }`;
}

export const resumeSegmentGroup =
  "flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] p-1";
