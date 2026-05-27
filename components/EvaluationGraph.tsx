"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApexAxisChartSeries, ApexOptions } from "apexcharts";

import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { InsightChipsInline } from "@/components/employee-insights/InsightChipsInline";
import type { EmployeeInsightViewModel } from "@/types/employee-insights";
import { useEvaluationScatterSelection } from "@/hooks/use-evaluation-scatter-selection";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Props = {
  employeeId: number | null | undefined;
  title?: string;
  insights?: EmployeeInsightViewModel[];
};

type ScatterDatum = {
  x: number;
  y: number;
  employee_id: number;
  society_id: number | null;
  department_id: number | null;
  category_id: number | null;
  evaluation_at: string;
  evaluation_year: number;
  bucket: "other" | "society" | "department" | "selected";
};

const TOKENS = {
  axis: "#94A3B8",
  grid: "rgba(148, 163, 184, 0.12)",

  other: "#475569", // slate
  society: "#3B82F6", // blue
  department: "#06B6D4", // cyan
  selected: "#3f9c35" , // corporate green

  selectedRing: "rgba(63, 156, 53, 0.4)",
  tooltipBg: "#0F172A",
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function formatBucketLabel(bucket: ScatterDatum["bucket"]) {
  switch (bucket) {
    case "selected":
      return "Empleado seleccionado";
    case "department":
      return "Mismo departamento";
    case "society":
      return "Misma sociedad";
    default:
      return "Resto de la organización";
  }
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function EvaluationGraph({
  employeeId,
  title = "ONA global vs Desempeño",
  insights = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(320);

  const {
    selectedPoint,
    sameSocietyPoints,
    sameDepartmentPoints,
    otherPoints,
    isLoading,
    isFetching,
    error,
    cycleLabel,
    totalPoints,
  } = useEvaluationScatterSelection(employeeId);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const h = Math.floor(entries[0].contentRect.height);
      setHeight(Math.max(h, 260));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const normalized = useMemo(() => {
    const normalize = (
      points: typeof otherPoints,
      bucket: ScatterDatum["bucket"],
    ): ScatterDatum[] => {
      return points
        .filter(
          (p) =>
            isValidNumber(p.final_score) &&
            p.final_score >= 50 &&
            isValidNumber(p.overall_percentile),
        )
        .map((p) => ({
          x: p.final_score,
          y: p.overall_percentile as number,
          employee_id: p.employee_id,
          society_id: p.society_id,
          department_id: p.department_id,
          category_id: p.category_id,
          evaluation_at: p.evaluation_at,
          evaluation_year: p.evaluation_year,
          bucket,
        }));
    };

    const selected =
      selectedPoint &&
      isValidNumber(selectedPoint.final_score) &&
      isValidNumber(selectedPoint.overall_percentile)
        ? [
            {
              x: selectedPoint.overall_percentile as number,
              y: selectedPoint.final_score,
              employee_id: selectedPoint.employee_id,
              society_id: selectedPoint.society_id,
              department_id: selectedPoint.department_id,
              category_id: selectedPoint.category_id,
              evaluation_at: selectedPoint.evaluation_at,
              evaluation_year: selectedPoint.evaluation_year,
              bucket: "selected" as const,
            },
          ]
        : [];

    return {
      other: normalize(otherPoints, "other"),
      society: normalize(sameSocietyPoints, "society"),
      department: normalize(sameDepartmentPoints, "department"),
      selected,
    };
  }, [otherPoints, sameSocietyPoints, sameDepartmentPoints, selectedPoint]);

  const allVisiblePoints = useMemo(() => {
    return [
      ...normalized.other,
      ...normalized.society,
      ...normalized.department,
      ...normalized.selected,
    ];
  }, [normalized]);

  const rawPointCount =
    otherPoints.length +
    sameSocietyPoints.length +
    sameDepartmentPoints.length +
    (selectedPoint ? 1 : 0);

  const missingOverallPercentileData =
    rawPointCount > 0 && allVisiblePoints.length === 0;

  const series = useMemo(() => {
    return [
      {
        name: "Resto organización",
        data: normalized.other,
      },
      {
        name: "Misma sociedad",
        data: normalized.society,
      },
      {
        name: "Mismo departamento",
        data: normalized.department,
      },
      {
        name: "Empleado seleccionado",
        data: normalized.selected,
      },
    ];
  }, [normalized]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "scatter",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true },
        background: "transparent",
        foreColor: TOKENS.axis,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        fontSize: "11px",
        labels: {
          colors: TOKENS.axis,
        },
        markers: {
          size: 8,
          shape: "circle",
        },
      },
      colors: [
        TOKENS.other,
        TOKENS.society,
        TOKENS.department,
        TOKENS.selected,
      ],
      grid: {
        borderColor: TOKENS.grid,
        strokeDashArray: 3,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
        padding: { top: 4, right: 10, bottom: 2, left: 4 },
      },
      xaxis: {
        min: 50,
        max: 100,
        tickAmount: 5,
        title: {
          text: "DESEMPEÑO",
          style: {
            color: TOKENS.axis,
            fontSize: "10px",
            fontWeight: 700,
          },
        },
        labels: {
          style: {
            colors: TOKENS.axis,
            fontSize: "10px",
          },
          formatter: (value) => `${Math.round(Number(value))}`,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        crosshairs: {
          show: true,
          stroke: {
            color: "rgba(148, 163, 184, 0.15)",
            width: 1,
            dashArray: 2,
          },
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        title: {
          text: "INFLUENCIA",
          style: {
            color: TOKENS.axis,
            fontSize: "10px",
            fontWeight: 700,
          },
        },
        labels: {
          style: {
            colors: TOKENS.axis,
            fontSize: "10px",
          },
          formatter: (value) => `${Math.round(Number(value))}`,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      markers: {
        size: [3, 4, 5, 8],
        strokeWidth: [0, 0, 0, 3],
        strokeColors: [
          "transparent",
          "transparent",
          "transparent",
          TOKENS.selectedRing,
        ],
        hover: {
          sizeOffset: 1,
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        shared: false,
        intersect: true,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const point = w.config.series?.[seriesIndex]?.data?.[dataPointIndex] as
            | ScatterDatum
            | undefined;

          if (!point) return "";

          return `
            <div style="
              min-width: 220px;
              padding: 10px 12px;
              background: ${TOKENS.tooltipBg};
              color: #fff;
              border-radius: 12px;
              font-family: Inter, system-ui;
              font-size: 12px;
              box-shadow: 0 8px 20px rgba(15, 23, 42, 0.24);
              border: 1px solid rgba(255,255,255,0.08);
            ">
              <div style="font-weight: 700; margin-bottom: 6px;">
                ${formatBucketLabel(point.bucket)}
              </div>
              <div style="opacity: 0.9; margin-bottom: 4px;">
                ONA overall percentile: <b>${point.x.toFixed(1)}</b>
              </div>
              <div style="opacity: 0.9; margin-bottom: 4px;">
                Desempeño: <b>${point.y.toFixed(1)}</b>
              </div>
              <div style="opacity: 0.7;">
                Evaluación: ${formatDateLabel(point.evaluation_at)}
              </div>
            </div>
          `;
        },
      },
      states: {
        hover: { filter: { type: "none" } },
        active: { filter: { type: "none" } },
      },
    }),
    [],
  );

  const showEmpty = !isLoading && !error && allVisiblePoints.length === 0;
  const selectedMissing =
    !isLoading &&
    !error &&
    employeeId != null &&
    totalPoints > 0 &&
    !selectedPoint;

  return (
    <Card className="py-3 bg-[var(--exec-card)]">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="py-1">{title}</CardTitle>
            {cycleLabel && (
              <div className="text-xs text-muted-foreground">
                Vista de pájaro · {cycleLabel}
              </div>
            )}
          </div>

          {!isLoading && totalPoints > 0 && (
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {totalPoints} puntos
            </div>
          )}
        </div>

        {insights.length > 0 && <InsightChipsInline insights={insights} />}
      </CardHeader>

      <CardContent className="pt-0 pb-2">
        <div ref={containerRef} className="w-full h-[340px] min-h-[300px]">
          {isLoading ? (
            <div className="h-full grid place-items-center text-sm">
              Cargando evaluación comparativa…
            </div>
          ) : error ? (
            <div className="h-full grid place-items-center text-sm text-red-400">
              No se pudo cargar la distribución del último ejercicio.
            </div>
          ) : showEmpty ? (
            <div className="h-full grid place-items-center px-6 text-center text-sm text-muted-foreground">
              {missingOverallPercentileData
                ? "Hay evaluaciones disponibles, pero falta el overall percentile de ONA para poder dibujar el scatter."
                : "No hay datos de evaluaciones disponibles para el último ejercicio."}
            </div>
          ) : (
            <>
              <ReactApexChart
                options={options}
                series={series as ApexAxisChartSeries}
                type="scatter"
                height={height}
                width="100%"
              />

              {selectedMissing && (
                <div className="mt-2 text-xs text-muted-foreground">
                  El empleado seleccionado no tiene evaluación en el último
                  ejercicio, por lo que no se puede resaltar su punto en la
                  distribución.
                </div>
              )}

              {isFetching && !isLoading && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Actualizando datos…
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
