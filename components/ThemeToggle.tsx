"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  function withThemeTransition(fn: () => void) {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    fn();
    window.setTimeout(() => root.classList.remove("theme-transition"), 120);
  }

  return (
    <button
      type="button"
      onClick={() =>
        withThemeTransition(() => setTheme(isDark ? "light" : "dark"))
      }
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white/85 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900",
        "dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100",
        className,
      )}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
