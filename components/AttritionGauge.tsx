"use client";

import * as React from "react";
import dynamic from "next/dynamic";

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getAttritionRiskMeta(probability: number) {
  const pct = probability * 100;

  if (pct <= 10) return { label: "Muy bajo", colorClass: "text-emerald-600 dark:text-emerald-300" };
  if (pct <= 20) return { label: "Bajo", colorClass: "text-lime-600 dark:text-lime-300" };
  if (pct <= 35) return { label: "Medio", colorClass: "text-amber-600 dark:text-amber-300" };
  return { label: "Alto", colorClass: "text-rose-600 dark:text-rose-300" };
}

export function AttritionGauge({
  probability,
  label,
  minSize = 170,
  maxSize = 230,
}: Props) {
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

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="mx-auto rounded-xl border border-slate-200/80 bg-slate-50/70 px-2 pt-2 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/35"
        style={{ width: size }}
      >
        <GaugeComponent
          type="semicircle"
          value={percentage}
          minValue={0}
          maxValue={100}
          arc={{
            width: isCompact ? 0.16 : 0.18,
            padding: 0.006,
            cornerRadius: 7,
            subArcs: [
              { limit: 10, color: "#22c55e", showTick: true },
              { limit: 20, color: "#eab308", showTick: true },
              { limit: 35, color: "#f97316", showTick: true },
              { limit: 100, color: "#ef4444", showTick: true },
            ],
          }}
          pointer={{
            type: "needle",
            color: "#22d3ee",
            length: isCompact ? 0.62 : 0.66,
            width: isCompact ? 8 : 10,
            elastic: true,
            animationDelay: 0,
          }}
          marginInPercentage={{ top: 0.08, bottom: 0.02, left: 0.06, right: 0.06 }}
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
                  fill: "#94a3b8",
                },
              },
              ticks: [
                { value: 0 },
                { value: 10 },
                { value: 20 },
                { value: 35 },
                { value: 100 },
              ],
            },
          }}
        />
      </div>

      <div className="-mt-1 flex flex-col items-center justify-center text-center">
        <div className={isCompact ? "text-2xl font-semibold text-slate-800 dark:text-slate-100" : "text-3xl font-semibold text-slate-800 dark:text-slate-100"}>
          {percentage.toFixed(1)}%
        </div>

        <div className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${risk.colorClass} border-current/25 bg-white/60 dark:bg-slate-900/50`}>
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
