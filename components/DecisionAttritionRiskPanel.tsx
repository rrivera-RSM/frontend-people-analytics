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

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35">
      <div className="grid min-h-[390px] grid-cols-1 lg:grid-cols-[minmax(300px,0.95fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-between border-b border-slate-200 p-5 dark:border-slate-700/80 lg:border-b-0 lg:border-r">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
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

          <div className="mt-5">
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
              <div className="grid min-h-[280px] place-items-center rounded-lg border border-dashed border-slate-300 bg-white/60 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                Sin estimación disponible
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white/75 p-3 dark:border-slate-700/80 dark:bg-slate-800/45">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Riesgo actual
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">
                {formatPct(currentProbability)}
              </div>
            </div>
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
              <div className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                Riesgo simulado
              </div>
              <div className="mt-1 text-lg font-semibold text-cyan-800 dark:text-cyan-100">
                {formatPct(simulationResult?.attritionProbability ?? null)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/75 p-3 dark:border-slate-700/80 dark:bg-slate-800/45">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Variación
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">
                {formatDelta(probabilityDelta)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white/75 p-4 dark:border-slate-700/80 dark:bg-slate-800/45">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Lectura del indicador
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Comparativa entre el riesgo base del empleado y la última
                  simulación ejecutada desde la propuesta salarial.
                </p>
              </div>
              {displayedRisk && (
                <span
                  className={`rounded-full border border-current/25 bg-white/70 px-2.5 py-1 text-xs font-semibold dark:bg-slate-900/45 ${displayedRisk.colorClass}`}
                >
                  {displayedRisk.label}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              El valor actual muestra la probabilidad estimada antes de aplicar
              cambios. El valor simulado aparece cuando se ejecuta una nueva
              propuesta desde el formulario lateral.
            </p>
          </div>

          {simulationError && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
              {simulationError}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
