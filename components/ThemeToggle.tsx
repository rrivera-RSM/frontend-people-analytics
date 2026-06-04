"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const isDark = resolvedTheme === "dark";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function withThemeTransition(fn: () => void) {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    fn();
    window.setTimeout(() => root.classList.remove("theme-transition"), 120);
  }

  const ariaLabel = !mounted
    ? "Cambiar tema"
    : isDark
      ? "Activar modo claro"
      : "Activar modo oscuro";

  const title = !mounted
    ? "Cambiar tema"
    : isDark
      ? "Modo claro"
      : "Modo oscuro";

  return (
    <button
      type="button"
      onClick={() =>
        withThemeTransition(() => setTheme(isDark ? "light" : "dark"))
      }
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100/85 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900",
        "dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100",
        className,
      )}
      aria-label={ariaLabel}
      title={title}
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
