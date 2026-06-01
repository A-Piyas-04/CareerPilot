"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          duration: 4000,
          classNames: {
            toast:
              "font-sans text-sm border-[var(--border)] bg-[var(--surface-raised)] text-[var(--foreground)] shadow-[var(--shadow-strong)]",
          },
        }}
      />
    </QueryClientProvider>
  );
}
