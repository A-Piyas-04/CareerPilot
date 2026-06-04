import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const themeInitScript = `
(function () {
  try {
    var theme = window.localStorage.getItem("careerpilot-theme");
    if (theme !== "dark" && theme !== "light") theme = "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--cp-workspace-main)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
