// components/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Evita mismatch SSR/CSR
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  function withThemeTransition(fn: () => void) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  fn();
  window.setTimeout(() => root.classList.remove("theme-transition"), 100);
}

  return (
    <button
      type="button"
      onClick={() => withThemeTransition(() => setTheme(isDark ? "light" : "dark"))}
      className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50
                 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      <span className="text-base">{isDark ? "☀️" : "🌙"}</span>
    </button>
  );
}