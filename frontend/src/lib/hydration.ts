/**
 * Some browser extensions inject attributes (e.g. `fdprocessedid`) onto
 * buttons and inputs before React hydrates. Suppress warnings on those nodes.
 */
export const suppressExtensionHydrationProps = {
  suppressHydrationWarning: true,
} as const;
