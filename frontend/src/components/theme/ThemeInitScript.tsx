"use client";

import { useServerInsertedHTML } from "next/navigation";

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

export function ThemeInitScript() {
  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{
        __html: themeInitScript,
      }}
    />
  ));

  return null;
}
