"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const GaugeComponent = dynamic(
  () => import("react-gauge-component"),
  { ssr: false },
);

type Props = {
  probability: number; // 0..1
  label?: string;
  minSize?: number;
  maxSize?: number;
};

const ATTRITION_THRESHOLD_PCT = 34.14;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getAttritionRiskMeta(probability: number) {
  const pct = probability * 100;

  if (pct < ATTRITION_THRESHOLD_PCT) {
    return {
      label: "Bajo riesgo",
      colorClass: "rsm-risk-very-low",
      accentClass:
        "text-[var(--rsm-green)] dark:text-[#8ed989]",
      badgeClass:
        "border-[color:rgb(var(--rsm-green-rgb)/0.25)] bg-[rgb(var(--rsm-green-rgb)/0.12)] text-[var(--rsm-green)] dark:border-[rgb(var(--rsm-green-rgb)/0.28)] dark:bg-[rgb(var(--rsm-green-rgb)/0.18)] dark:text-[#8ed989]",
      surfaceClass:
        "border-[color:rgb(var(--rsm-green-rgb)/0.24)] bg-[linear-gradient(180deg,rgba(63,156,53,0.10),rgba(63,156,53,0.03))] dark:border-[rgb(var(--rsm-green-rgb)/0.24)] dark:bg-[linear-gradient(180deg,rgba(63,156,53,0.16),rgba(63,156,53,0.05))]",
    };
  }

  return {
    label: "Alto riesgo",
    colorClass: "rsm-risk-high",
    accentClass:
      "text-[var(--rsm-red)] dark:text-[#ff9ab8]",
    badgeClass:
      "border-[color:rgb(var(--rsm-red-rgb)/0.24)] bg-[rgb(var(--rsm-red-rgb)/0.11)] text-[var(--rsm-red)] dark:border-[rgb(var(--rsm-red-rgb)/0.28)] dark:bg-[rgb(var(--rsm-red-rgb)/0.18)] dark:text-[#ff9ab8]",
    surfaceClass:
      "border-[color:rgb(var(--rsm-red-rgb)/0.24)] bg-[linear-gradient(180deg,rgba(228,0,70,0.09),rgba(228,0,70,0.03))] dark:border-[rgb(var(--rsm-red-rgb)/0.24)] dark:bg-[linear-gradient(180deg,rgba(228,0,70,0.15),rgba(228,0,70,0.05))]",
  };
}

export function AttritionGauge({
  probability,
  label,
  minSize = 170,
  maxSize = 230,
}: Props) {
  const { resolvedTheme } = useTheme();
  const safeProbability = clamp(probability ?? 0, 0, 1);
  const percentage = safeProbability * 100;
  const risk = getAttritionRiskMeta(safeProbability);

  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState(205);

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (!width) return;

      /**
       * Dejamos margen interno para que el gauge no toque bordes.
       */
      const next = clamp(width - 16, minSize, maxSize);
      setSize(next);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [minSize, maxSize]);

  const isCompact = size < 190;
  const pointerColor = resolvedTheme === "dark" ? "#F8FAFC" : "#00153D";

  return (
    <div ref={wrapRef} className="w-full">
      <div className="mx-auto" style={{ width: size }}>
        <GaugeComponent
          type="semicircle"
          value={percentage}
          minValue={0}
          maxValue={100}
          arc={{
            width: isCompact ? 0.15 : 0.17,
            padding: 0.004,
            cornerRadius: 6,
            subArcs: [
              {
                limit: ATTRITION_THRESHOLD_PCT,
                color: "#3F9C35",
                showTick: true,
              },
              { limit: 100, color: "#E40046", showTick: true },
            ],
          }}
          pointer={{
            type: "needle",
            color: pointerColor,
            length: isCompact ? 0.61 : 0.65,
            width: isCompact ? 8 : 9,
            elastic: true,
            animationDelay: 0,
          }}
          marginInPercent={{ top: 0.08, bottom: 0.02, left: 0.06, right: 0.06 }}
          labels={{
            valueLabel: {
              hide: true,
            },
            tickLabels: {
              type: "outer",
              defaultTickValueConfig: {
                formatTextValue: (value: number) => `${Math.round(value)}`,
                style: {
                  fontSize: isCompact ? "10px" : "11px",
                  fontWeight: "600",
                  fill: "#888B8D",
                },
              },
              ticks: [
                { value: 0 },
                { value: ATTRITION_THRESHOLD_PCT },
                { value: 100 },
              ],
            },
          }}
        />
      </div>

      <div className="-mt-2 flex flex-col items-center justify-center text-center">
        <div
          className={cn(
            isCompact ? "text-2xl" : "text-3xl",
            "font-semibold text-slate-900 dark:text-slate-50",
          )}
        >
          {percentage.toFixed(1)}%
        </div>

        <div
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            risk.badgeClass,
          )}
        >
          {risk.label}
        </div>

        {label && (
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
