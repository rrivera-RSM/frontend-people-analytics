"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApexOptions } from "apexcharts";
import { Card, CardTitle, CardContent, CardHeader } from "./ui/card";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Evaluation = {
  evaluation_at: string;
  final_score: number;
  impact_evaluation_at: string;
  bol_positive_impact: number;
};

type Props = {
  data: Evaluation[];
  loading: boolean;
};

type XYPoint = {
  x: number;
  y: number;
  year: number;
  raw: Evaluation;
};

function toYear(iso: string) {
  return new Date(iso).getUTCFullYear();
}

// ✅ Mejor fuera del componente si lo usas en useMemo([])
const TOKENS = {
  muted: "#64748B",
  grid: "#E8EEF6",
  primary: "#0B5FFF",
  point: "#B9C4D3",
  line: "#9FB7FF",
  tooltipBg: "#0B5FFF",
};

export default function EvaluationGraph({ data, loading }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(220); // fallback real

  // Observa el alto del contenedor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const h = Math.floor(entries[0].contentRect.height);
      setHeight(Math.max(h, 120));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points: XYPoint[] = useMemo(() => {
    return [...(data ?? [])]
      .map((r) => ({
        x: r.bol_positive_impact,
        y: r.final_score,
        year: toYear(r.evaluation_at),
        raw: r,
      }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  // ✅ Hooks SIEMPRE se ejecutan (aunque points esté vacío)
  const series = useMemo(() => {
    if (!points.length) return [];

    const last = points[points.length - 1];

    return [
      {
        name: "Progresión",
        type: "line" as const,
        data: points.map((p) => ({ x: p.x, y: p.y })),
      },
      {
        name: "Evaluaciones",
        type: "scatter" as const,
        data: points.map((p) => ({ x: p.x, y: p.y, year: p.year })),
      },
      {
        name: "Última evaluación",
        type: "scatter" as const,
        data: [{ x: last.x, y: last.y, year: last.year }],
      },
    ];
  }, [points]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true },
        background: "transparent",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        foreColor: TOKENS.muted,
      },
      colors: [TOKENS.line, TOKENS.point, TOKENS.primary],
      stroke: {
        width: [2, 0, 0],
        curve: "straight",
        dashArray: [4, 0, 0],
      },
      markers: {
        size: [0, 4, 6],
        strokeWidth: 2,
        strokeColors: ["transparent", "#FFFFFF", "#FFFFFF"],
        hover: { size: 7 },
      },
      grid: {
        borderColor: TOKENS.grid,
        strokeDashArray: 3,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
        padding: { top: 8, right: 12, bottom: 8, left: 12 },
      },
      legend: { show: false },
      xaxis: {
        title: {
          text: "IMPACTO POSITIVO",
          style: { color: TOKENS.muted, fontSize: "10px", fontWeight: 700 },
        },
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickAmount: 4,
        tooltip: { enabled: false },
        crosshairs: {
          show: true,
          stroke: { color: TOKENS.grid, width: 1, dashArray: 2 },
        },
      },
      yaxis: {
        title: {
          text: "DESEMPEÑO",
          style: { color: TOKENS.muted, fontSize: "10px", fontWeight: 700 },
        },
        labels: { show: false },
        min: 0,
        max: 100,
        tickAmount: 4,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      tooltip: {
        shared: false,
        intersect: true,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const d: any = w.config.series?.[seriesIndex]?.data?.[dataPointIndex];
          const x = d?.x ?? "-";
          const y = d?.y ?? "-";
          const year = d?.year ?? "—";

          return `
            <div style="
              padding:8px 10px;
              background:${TOKENS.tooltipBg};
              color:#fff;
              border-radius:10px;
              font-family:Inter, system-ui;
              font-size:12px;
              box-shadow:0 8px 20px rgba(15, 23, 42, 0.15);
            ">
              <div style="font-weight:700; line-height:1; margin-bottom:6px;">${year}</div>
              <div style="opacity:0.95">X: <b>${x}</b> · Y: <b>${y}</b></div>
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

  const showEmpty = !loading && points.length === 0;

  return (
    <Card className="py-3 bg-[var(--exec-card)]">
      <CardHeader>
        <CardTitle className="py-1">Impacto vs Desempeño</CardTitle>
      </CardHeader>

      {/* ✅ Contenedor observado: SIEMPRE existe */}
      <CardContent className="pt-0 pb-2">
        <div ref={containerRef} className="w-full h-[260px] min-h-[220px]">
          {loading ? (
            <div className="h-full grid place-items-center text-sm">Cargando…</div>
          ) : showEmpty ? (
            <div className="h-full w-full rounded-lg bg-slate-50/60" />
          ) : (
            <ReactApexChart
              options={options}
              series={series as any}
              type="line"
              height={height}   // ✅ altura numérica real (responsive al contenedor)
              width="100%"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}