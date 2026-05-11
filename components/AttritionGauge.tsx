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

function getRiskLabel(probability: number) {
  const pct = probability * 100;

  if (pct <= 10) return { label: "MUY BAJO", colorClass: "text-emerald-400" };
  if (pct <= 20) return { label: "BAJO", colorClass: "text-lime-400" };
  if (pct <= 35) return { label: "MEDIO", colorClass: "text-amber-400" };
  return { label: "ALTO", colorClass: "text-red-400" };
}

export function AttritionGauge({
  probability,
  label,
  minSize = 170,
  maxSize = 230,
}: Props) {
  const safeProbability = clamp(probability ?? 0, 0, 1);
  const percentage = safeProbability * 100;
  const risk = getRiskLabel(safeProbability);

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
      <div className="mx-auto" style={{ width: size }}>
        <GaugeComponent
          type="semicircle"
          value={percentage}
          minValue={0}
          maxValue={100}
          arc={{
            width: isCompact ? 0.14 : 0.16,
            padding: 0.005,
            cornerRadius: 5,
            subArcs: [
              { limit: 10, color: "#34d399", showTick: true }, // emerald
              { limit: 20, color: "#a3e635", showTick: true }, // lime
              { limit: 35, color: "#fbbf24", showTick: true }, // amber
              { limit: 100, color: "#f87171", showTick: true }, // red
            ],
          }}
          pointer={{
            type: "needle",
            color: "#e2e8f0",
            length: isCompact ? 0.64 : 0.68,
            width: isCompact ? 9 : 11,
            elastic: true,
            animationDelay: 0,
          }}
          labels={{
            valueLabel: {
              hide: true,
            },
            tickLabels: {
              type: "outer",
              defaultTickValueConfig: {
                formatTextValue: (value: number) => `${Math.round(value)}`,
                style: {
                  fontSize: isCompact ? "9px" : "10px",
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

      <div className="-mt-2 flex flex-col items-center justify-center text-center">
        <div className={isCompact ? "text-2xl font-bold" : "text-3xl font-bold"}>
          {percentage.toFixed(1)}%
        </div>

        <div className={`text-sm font-semibold ${risk.colorClass}`}>
          {risk.label}
        </div>

        {label && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
