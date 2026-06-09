"use client";

import { useEffect } from "react";

export function useWarmChartLibraries(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let cancelled = false;

    const warm = () => {
      if (cancelled) return;
      void import("apexcharts");
      void import("react-apexcharts");
      void import("react-gauge-component");
      void import("react-force-graph-2d");
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warm, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(warm, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [enabled]);
}
