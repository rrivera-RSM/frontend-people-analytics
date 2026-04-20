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
        <div className="flex items-center gap-2">
          <span className="text-[#68646c]">Sin valores de ONA activo</span>
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
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 hidden group-hover:block bg-gray-800 text-white text-sm rounded-md p-3 w-48 z-10">
          Este empleado no tiene valores para ONA activo, es posible que esto se deba a una reciente incorporación posterior a las encuestas de clima de RSM. Si crees que este empleado deberia tener valores de ONA activo, ponte en contacto con People
        </div>
          </div>
        </div>
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
};
