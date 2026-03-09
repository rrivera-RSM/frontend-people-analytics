"use client";

import dynamic from "next/dynamic";
import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import { OnaData } from "./EmployeeView";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Props = {
  data: OnaData | null | undefined;
  title?: string;
  color?: string;
  fillColor?: string;
  loading?: boolean;
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

export default function OnaRadarChart({
  data,
  color = "#00153d",
  fillColor = "#009cde",
  loading,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;

      const w = Math.floor(cr.width);
      const h = Math.floor(cr.height);

      setSize((prev) =>
        prev.width === w && prev.height === h ? prev : { width: w, height: h },
      );
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

  // 👉 Lado cuadrado: el radar se ve MUCHO mejor así
  const side = useMemo(() => {
    if (size.width === 0 || size.height === 0) return 0;

    // “aire” para labels + datalabels:
    const reserve = size.width < 360 ? 54 : 70;

    const s = Math.min(size.width, size.height) - reserve;
    return Math.max(180, Math.floor(s)); // mínimo razonable
  }, [size.width, size.height]);

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "radar",
        toolbar: { show: false },
        animations: { enabled: true },
        redrawOnWindowResize: true,
        redrawOnParentResize: true,

        // 🔑 evita offsets raros en layouts flex/grid

        // Si todavía lo ves algo abajo, prueba con -10 / -15
      },
      grid: {
        // 🔑 reduce el “margen” interno que a veces empuja el radar
      },
      xaxis: {
        categories: LABELS,
        labels: {
          style: { fontSize: side < 240 ? "10px" : "12px" },
          // Ajuste fino para subir un pelín las etiquetas si hace falta
          offsetY: -2,
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 4,
        labels: { formatter: (val) => `${Math.round(val)}` },
      },
      stroke: { width: 2, colors: [color] },
      fill: { type: "solid", opacity: 0.25, colors: [fillColor] },
      markers: {
        size: 4,
        colors: [color],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: { size: 6 },
      },
      dataLabels: {
        enabled: true,
        background: { enabled: true, borderRadius: 4 },
      },
      tooltip: { y: { formatter: (val) => `${val.toFixed(1)}%` } },
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: "#e5e7eb",
            fill: { colors: ["#f9fafb", "#ffffff"] },
          },
        },
      },
    }),
    [color, fillColor, side],
  );

  if (!data) {
    return (
      <div ref={wrapRef} className="w-full h-full grid place-items-center">
        <span className="text-[#68646c]">Sin datos para mostrar</span>
      </div>
    );
  }

  return (
    <Card className="py-3 bg-[var(--exec-card)]">
      <CardHeader>
        <CardTitle className="py-1">
          {" "}
          Analisis Organizacional de Empresas (ONA){" "}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-2">
        {loading ? (
          <div className="h-full grid place-items-center text-sm">
            Cargando…
          </div>
        ) : (
          <Chart
            options={options}
            series={series}
            type="radar"
            height={side}
            width={side}
          />
        )}
      </CardContent>
    </Card>
  );
}
``;
