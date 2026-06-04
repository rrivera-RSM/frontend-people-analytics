"use client";

import { Activity } from "lucide-react";

import {
  AttritionGauge,
  getAttritionRiskMeta,
} from "@/components/AttritionGauge";
import type { SimulationResult } from "@/types/compensation";

type Props = {
  currentProbability: number | null;
  simulationResult: SimulationResult | null;
  simulationError: string | null;
};

function formatPct(value: number | null) {
  return value == null ? "-" : `${(value * 100).toFixed(1)}%`;
}

function formatDelta(value: number | null) {
  if (value == null) return "-";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(1)} pp`;
}

export function DecisionAttritionRiskPanel({
  currentProbability,
  simulationResult,
  simulationError,
}: Props) {
  const displayedProbability =
    simulationResult?.attritionProbability ?? currentProbability;
  const displayedRisk =
    displayedProbability == null
      ? null
      : getAttritionRiskMeta(displayedProbability);
  const probabilityDelta =
    currentProbability != null && simulationResult
      ? simulationResult.attritionProbability - currentProbability
      : null;
  const indicatorSurfaceClass =
    displayedRisk?.surfaceClass ??
    "border-slate-200 bg-slate-100/70 dark:border-slate-700/80 dark:bg-slate-900/35";
  const deltaToneClass =
    probabilityDelta == null
      ? "text-slate-950 dark:text-slate-50"
      : probabilityDelta > 0
        ? "text-[var(--rsm-red)] dark:text-[#ff9ab8]"
        : probabilityDelta < 0
          ? "text-[var(--rsm-green)] dark:text-[#8ed989]"
          : "text-slate-950 dark:text-slate-50";
  const indicatorNarrative =
    displayedRisk?.label === "Alto riesgo"
      ? "La señal actual sitúa al empleado en una zona de riesgo elevada. Si las simulaciones salariales apenas modifican el indicador, conviene considerar posibles carencias en la propuesta de valor o factores externos no económicos que puedan estar influyendo en la predicción de fuga."
      : displayedRisk?.label === "Bajo riesgo"
        ? "La señal actual sitúa al empleado en una zona de riesgo contenida. En este escenario, la propuesta salarial acompaña una situación relativamente estable y las simulaciones sirven para validar que el riesgo se mantiene bajo control."
        : "No hay información suficiente para interpretar el riesgo de fuga del empleado con el nivel de detalle esperado.";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-[var(--exec-card)] shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35">
      <div className="grid min-h-[390px] grid-cols-1 lg:grid-cols-[minmax(300px,0.95fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-between border-b border-slate-200 p-5 dark:border-slate-700/80 lg:border-b-0 lg:border-r">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4 text-[var(--rsm-blue)] dark:text-[#79d7ff]" />
              Riesgo de fuga
            </div>
            <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
              Probabilidad estimada de salida
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Lectura predictiva del riesgo del empleado, contextualizada con
              la propuesta de compensación y las señales disponibles.
            </p>
          </div>

          <div className="mt-6">
            {displayedProbability != null ? (
              <AttritionGauge
                probability={displayedProbability}
                minSize={300}
                maxSize={360}
                label={
                  simulationResult
                    ? "Riesgo estimado tras simulación"
                    : "Riesgo actual estimado"
                }
              />
            ) : (
              <div className="grid min-h-[280px] place-items-center rounded-lg border border-dashed border-slate-300/80 bg-white/45 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                Sin estimación disponible
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-200/55 p-3 dark:border-slate-700/80 dark:bg-slate-800/45">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Riesgo actual
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">
                {formatPct(currentProbability)}
              </div>
            </div>
            <div className="rounded-lg border border-[color:rgb(var(--rsm-blue-rgb)/0.22)] bg-[rgb(var(--rsm-blue-rgb)/0.06)] p-3">
              <div className="text-xs font-medium text-[#007db2] dark:text-[#79d7ff]">
                Riesgo simulado
              </div>
              <div className="mt-1 text-lg font-semibold text-[var(--rsm-blue)] dark:text-[#d8f6ff]">
                {formatPct(simulationResult?.attritionProbability ?? null)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-200/55 p-3 dark:border-slate-700/80 dark:bg-slate-800/45">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Variación
              </div>
              <div className={`mt-1 text-lg font-semibold ${deltaToneClass}`}>
                {formatDelta(probabilityDelta)}
              </div>
            </div>
          </div>

          <div className={`mt-4 rounded-lg border p-4 ${indicatorSurfaceClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Lectura del indicador
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Señal binaria respecto al umbral corporativo de atención del 34,14%.
                </p>
              </div>
              {displayedRisk && (
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${displayedRisk.badgeClass}`}
                >
                  {displayedRisk.label}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {indicatorNarrative}
            </p>
          </div>

          {simulationError && (
            <div className="mt-4 rounded-lg border border-[color:rgb(var(--rsm-red-rgb)/0.3)] bg-[rgb(var(--rsm-red-rgb)/0.1)] p-3 text-sm text-[var(--rsm-red)] dark:text-[#ff9ab8]">
              {simulationError}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
