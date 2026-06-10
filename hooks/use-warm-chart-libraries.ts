"use client";

import { useEffect } from "react";

type BrowserWindowWithIdleCallback = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export function useWarmChartLibraries(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const browserWindow = window as BrowserWindowWithIdleCallback;
    let cancelled = false;

    const warm = () => {
      if (cancelled) return;
      void import("apexcharts");
      void import("react-apexcharts");
      void import("react-gauge-component");
      void import("react-force-graph-2d");
    };

    if (typeof browserWindow.requestIdleCallback === "function") {
      const idleId = browserWindow.requestIdleCallback(warm, { timeout: 1500 });
      return () => {
        cancelled = true;
        browserWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = browserWindow.setTimeout(warm, 350);
    return () => {
      cancelled = true;
      browserWindow.clearTimeout(timeoutId);
    };
  }, [enabled]);
}
