"use client";

import dynamic from "next/dynamic";
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import type { OnaData } from "./EmployeeView";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { EmployeeInsightViewModel } from "@/types/employee-insights";
import { InsightChipsInline } from "./employee-insights/InsightChipsInline";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  data: OnaData | null | undefined;
  title?: string;
  color?: string;
  fillColor?: string;
  loading?: boolean;
  insights?: EmployeeInsightViewModel[];
};

const LABELS = [
  "Compartir información",
  "Apoyo técnico",
  "Apoyo personal",
  "Inspiración",
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
  title = "Analisis Organizacional de Empresas (ONA)",
  color = "#00153d",
  fillColor = "#009cde",
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

  const series = useMemo(() => [{ name: "Percentil", data: values }], [values]);

  /**
   * Tamaño objetivo:
   * - responsive
   * - más contenido “alrededor”
   * - capado para que no se coma la card
   */
  const chartSide = useMemo(() => {
    if (!containerWidth) return 220;

    // Queremos que no use todo el ancho disponible
    const desired = Math.floor(containerWidth * 0.5);

    // Lo capamos para no deformar layouts con cards vecinas
    return clamp(desired, 190, 300);
  }, [containerWidth]);

  /**
   * Tamaño interno del radar:
   * deja margen para labels y datalabels
   */
  const radarSize = useMemo(() => {
    return clamp(chartSide - 120, 100, 90);
  }, [chartSide]);

  const labelFontSize = chartSide < 220 ? "10px" : "11px";
  const valueFontSize = chartSide < 220 ? "10px" : "11px";

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "radar",
        toolbar: { show: false },
        animations: { enabled: true },
        redrawOnWindowResize: true,
        redrawOnParentResize: true,
      },
      grid: {
        padding: {
          top: -18,
          bottom: -10,
          left: -8,
          right: -8,
        },
      },
      xaxis: {
        categories: LABELS,
        labels: {
          style: {
            fontSize: labelFontSize,
          },
          offsetY: -2,
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: {
          formatter: (val) => `${Math.round(val)}`,
          style: {
            fontSize: "10px",
          },
        },
      },
      stroke: {
        width: 2,
        colors: [color],
      },
      fill: {
        type: "solid",
        opacity: 0.22,
        colors: [fillColor],
      },
      markers: {
        size: 3,
        colors: [color],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: { size: 5 },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: valueFontSize,
          fontWeight: 600,
        },
        background: {
          enabled: true,
          borderRadius: 4,
          padding: 2,
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
            strokeColors: "#e5e7eb",
            fill: {
              colors: ["#f9fafb", "#ffffff"],
            },
          },
        },
      },
    }),
    [color, fillColor, labelFontSize, valueFontSize, radarSize],
  );

  return (
    <Card className="overflow-hidden py-2 bg-[var(--exec-card)]">
      <CardHeader className="px-4 py-2 space-y-3">
        <CardTitle className="text-base leading-tight">{title}</CardTitle>

        {insights.length > 0 && <InsightChipsInline insights={insights} />}
      </CardHeader>

      <CardContent className="px-3 pt-0 pb-3">
        {!data ? (
          <div className="min-h-[180px] grid place-items-center">
            <div className="flex items-center gap-2 text-center">
              <span className="text-[#68646c] text-sm">
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
          <div
            ref={wrapRef}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]"
          >
            <div className="w-full overflow-hidden">
              <div className="mx-auto flex w-full justify-center overflow-hidden">
                <Chart
                  options={options}
                  series={series}
                  type="radar"
                  width={chartSide} // deja margen para labels y datalabels
                  height={chartSide}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
``;
