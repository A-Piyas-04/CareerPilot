import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CareerPilot",
  description: "AI-powered career co-pilot — job tracker, CV intelligence, and career planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[var(--cp-page-bg)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
