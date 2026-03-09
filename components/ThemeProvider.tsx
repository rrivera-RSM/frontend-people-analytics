// components/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"     // <- pone .dark en <html>
      defaultTheme="system" // system | light | dark
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}