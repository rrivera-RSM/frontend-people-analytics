"use client";

import dynamic from "next/dynamic";
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import { Info } from "lucide-react";

import type { OnaData } from "./EmployeeView";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { EmployeeInsightViewModel } from "@/types/employee-insights";
import { InsightChipsInline } from "./employee-insights/InsightChipsInline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  data: OnaData | null | undefined;
  title?: string;
  color?: string;
  fillColor?: string;
  loading?: boolean;
  insights?: EmployeeInsightViewModel[];
};

const LABELS = ["CI", "AT", "AP", "IN"];

const ONA_LABEL_HELP = [
  {
    short: "CI",
    full: "Compartir información",
    colorClass: "bg-[var(--rsm-blue)]",
    description:
      "Mide hasta qué punto esta persona es percibida como una fuente útil para compartir y mover información dentro de la organización.",
  },
  {
    short: "AT",
    full: "Apoyo técnico",
    colorClass: "bg-[var(--rsm-turquoise)]",
    description:
      "Refleja el reconocimiento de esta persona como apoyo experto o referente para resolver dudas técnicas o profesionales.",
  },
  {
    short: "AP",
    full: "Apoyo personal",
    colorClass: "bg-[var(--rsm-purple)]",
    description:
      "Indica el nivel de confianza o cercanía percibida para apoyar a otras personas en situaciones personales o relacionales.",
  },
  {
    short: "IN",
    full: "Inspiración",
    colorClass: "bg-[var(--rsm-yellow)]",
    description:
      "Representa la capacidad de inspirar, influir o movilizar a otras personas dentro de la organización.",
  },
];

function clamp0to100(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function OnaRadarChart({
  data,
  title = "Análisis de Red Organizacional (ONA)",
  color = "#009CDE",
  fillColor = "#34A798",
  loading = false,
  insights = [],
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;

    const el = wrapRef.current;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;

      const nextWidth = Math.floor(cr.width);
      setContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = useMemo(() => {
    if (!data) return [0, 0, 0, 0];

    return [
      clamp0to100(data.percentile_1),
      clamp0to100(data.percentile_2),
      clamp0to100(data.percentile_3),
      clamp0to100(data.percentile_4),
    ];
  }, [data]);

  const series = useMemo(
    () => [{ name: "Percentil", data: values }],
    [values],
  );

  const onaItemsWithValue = useMemo(
    () =>
      ONA_LABEL_HELP.map((item, index) => ({
        ...item,
        value: values[index] ?? 0,
      })),
    [values],
  );

  /**
   * Hacemos que el chart use realmente el ancho útil de la card,
   * en vez de caparlo a 290.
   */
  const chartWidth = useMemo(() => {
    if (!containerWidth) return 380;
    return clamp(containerWidth - 8, 260, 520);
  }, [containerWidth]);

  /**
   * Altura algo menor que el ancho, pero ya mucho más generosa.
   */
  const chartHeight = useMemo(() => {
    return clamp(Math.round(chartWidth * 2.5), 360, 410);
  }, [chartWidth]);

  /**
   * Radar considerablemente mayor dentro del chart.
   * Este es el cambio clave para “llenar” mejor la card.
   */
  const radarSize = useMemo(() => {
    return clamp(Math.round(chartWidth * 0.5), 105, 155);
  }, [chartWidth]);

  const compact = chartWidth < 240;
  const labelFontSize = compact ? "11px" : "12px";
  const valueFontSize = compact ? "10px" : "11px";

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "radar",
        toolbar: { show: false },
        animations: { enabled: true },
        redrawOnWindowResize: true,
        redrawOnParentResize: true,
        background: "transparent",
        foreColor: "#888B8D",
      },
      grid: {
        padding: {
          top: compact ? 10 : 14,
          bottom: compact ? 6 : 10,
          left: compact ? 6 : 12,
          right: compact ? 6 : 12,
        },
      },
      xaxis: {
        categories: LABELS,
        labels: {
          style: {
            fontSize: labelFontSize,
            fontWeight: 600,
            colors: ["#63666A", "#63666A", "#63666A", "#63666A"],
          },
          offsetY: 0,
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          show: false,
        },
      },
      stroke: {
        width: 2.2,
        colors: [color],
      },
      fill: {
        type: "solid",
        opacity: 0.18,
        colors: [fillColor],
      },
      markers: {
        size: compact ? 3 : 3.5,
        colors: [color],
        strokeColors: "#FFFFFF",
        strokeWidth: 2,
        hover: { size: compact ? 5 : 6 },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: valueFontSize,
          fontWeight: 600,
          colors: ["#FFFFFF"],
        },
        background: {
          enabled: true,
          borderRadius: 4,
          padding: 3,
          opacity: 0.74,
          foreColor: "#FFFFFF",
          borderWidth: 0,
          backgroundColor: "rgba(0, 21, 61, 0.82)",
        },
        dropShadow: {
          enabled: false,
        },
      },
      tooltip: {
        y: {
          formatter: (val) => `${val.toFixed(1)}%`,
        },
      },
      plotOptions: {
        radar: {
          size: radarSize,
          polygons: {
            strokeColors: "rgba(136, 139, 141, 0.24)",
            connectorColors: "rgba(136, 139, 141, 0.24)",
            fill: {
              colors: [
                "rgba(0, 156, 222, 0.06)",
                "rgba(52, 167, 152, 0.04)",
              ],
            },
          },
        },
      },
    }),
    [color, compact, fillColor, labelFontSize, radarSize, valueFontSize],
  );

  return (
    <Card className="overflow-hidden py-2 bg-[var(--exec-card)]">
      <CardHeader className="px-4 py-2 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base leading-tight">{title}</CardTitle>

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Explicación de siglas ONA"
                  className="
                    inline-flex h-7 w-7 items-center justify-center
                    rounded-full border border-white/6
                    bg-white/[0.03]
                    text-slate-400
                    transition-colors
                    hover:bg-white/[0.07] hover:text-slate-200
                    dark:text-slate-500 dark:hover:text-slate-100
                  "
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>

              <TooltipContent
                side="left"
                align="start"
                className="
                  max-w-[320px]
                  rounded-2xl
                  border border-white/10
                  bg-slate-950/95
                  p-4
                  text-slate-50
                  shadow-[0_16px_40px_rgba(0,0,0,0.35)]
                  backdrop-blur-md
                "
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Dimensiones ONA
                  </div>
                  <div className="text-[11px] leading-5 text-slate-400">
                    La descripción completa está disponible en el panel derecho.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {insights.length > 0 && <InsightChipsInline insights={insights} />}
      </CardHeader>

      <CardContent className="px-3 pt-0 pb-3">
        {!data ? (
          <div className="min-h-[180px] grid place-items-center">
            <div className="flex items-center gap-2 text-center">
              <span className="text-[var(--rsm-dark-grey)] text-sm">
                Sin valores de ONA activo
              </span>

              <div className="group relative inline-block">
                <svg
                  className="w-5 h-5 text-gray-400 cursor-help"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>

                <div className="absolute left-full top-1/2 z-10 ml-2 hidden w-56 -translate-y-1/2 rounded-md bg-gray-800 p-3 text-sm text-white group-hover:block">
                  Este empleado no tiene valores para ONA activo. Es posible que
                  se deba a una incorporación reciente posterior a las encuestas
                  de clima de RSM. Si crees que este empleado debería tener
                  valores de ONA activo, ponte en contacto con People.
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="min-h-[180px] grid place-items-center text-sm">
            Cargando…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_1fr]">
            <div ref={wrapRef} className="w-full overflow-hidden rounded-xl border border-slate-300/70 bg-slate-200/45 p-2 dark:border-slate-800/80 dark:bg-slate-900/25">
              <div className="mx-auto flex w-full justify-center overflow-hidden">
                <Chart
                  options={options}
                  series={series}
                  type="radar"
                  width={chartWidth * 1.02}
                  height={chartHeight}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-300/80 bg-slate-200/45 p-3 dark:border-slate-800/80 dark:bg-slate-900/25">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Interpretación ONA
              </div>
              <div className="space-y-2.5">
                {onaItemsWithValue.map((item) => (
                  <div
                    key={item.short}
                    className="rounded-lg border border-slate-300/90 bg-slate-100/85 p-2.5 dark:border-slate-700/70 dark:bg-slate-900/55"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.colorClass}`} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {item.short}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {item.full}
                        </span>
                      </div>
                      <span className="rounded-full border border-slate-300/80 bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
