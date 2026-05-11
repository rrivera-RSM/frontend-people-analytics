"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppQueryClientProvider } from "@/components/providers/query-client-provider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppQueryClientProvider>
      <ThemeProvider>{children}</ThemeProvider>
      </AppQueryClientProvider>
    </SessionProvider>
  );
}
