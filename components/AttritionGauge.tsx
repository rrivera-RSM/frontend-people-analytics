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
  comparisonProbability?: number | null;
  label?: string;
  minSize?: number;
  maxSize?: number;
};

const ATTRITION_THRESHOLD_PCT = 34.14;
const OVERLAY_OUTER_RADIUS = 34.2;
const OVERLAY_INNER_RADIUS = 7.5;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toGaugeAngle(value: number) {
  return 180 - (value / 100) * 180;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY - radius * Math.sin(angleInRadians),
  };
}

function describeRingSectorPath(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
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
  comparisonProbability = null,
  label,
  minSize = 170,
  maxSize = 230,
}: Props) {
  const { resolvedTheme } = useTheme();
  const safeProbability = clamp(probability ?? 0, 0, 1);
  const percentage = safeProbability * 100;
  const safeComparisonProbability =
    typeof comparisonProbability === "number" &&
    Number.isFinite(comparisonProbability)
      ? clamp(comparisonProbability, 0, 1)
      : null;
  const comparisonPercentage =
    safeComparisonProbability != null ? safeComparisonProbability * 100 : null;
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
  const overlayColor =
    comparisonPercentage != null && comparisonPercentage > percentage
      ? "rgba(63, 156, 53, 0.38)"
      : "rgba(228, 0, 70, 0.34)";
  const overlayDelta =
    comparisonPercentage != null
      ? Math.abs(comparisonPercentage - percentage)
      : 0;
  const hasComparisonOverlay =
    comparisonPercentage != null && overlayDelta >= 0.02;
  const overlayStartAngle =
    comparisonPercentage != null
      ? toGaugeAngle(Math.max(comparisonPercentage, percentage))
      : 0;
  const overlayEndAngle =
    comparisonPercentage != null
      ? toGaugeAngle(Math.min(comparisonPercentage, percentage))
      : 0;
  const overlaySectorPath = hasComparisonOverlay
    ? describeRingSectorPath(
        50,
        56,
        OVERLAY_OUTER_RADIUS,
        OVERLAY_INNER_RADIUS,
        overlayStartAngle,
        overlayEndAngle,
      )
    : null;

  return (
    <div ref={wrapRef} className="w-full">
      <div className="mx-auto relative" style={{ width: size }}>
        {hasComparisonOverlay && overlaySectorPath && (
          <svg
            viewBox="0 0 100 64"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <path
              d={overlaySectorPath}
              fill={overlayColor}
              opacity={resolvedTheme === "dark" ? 0.9 : 0.95}
            />
          </svg>
        )}

        <div className="relative z-10">
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
