"use client";

import { getMaxOnaPercentile } from "@/lib/employee-insights";
import type { EmployeeInsightFeaturesApi } from "@/types/employee-insights";

type Props = {
  features: EmployeeInsightFeaturesApi | null;
};

function formatNumber(value?: number | null, digits = 1) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function SummaryItem({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-black/20">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value}</div>
      {helper && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</div>}
    </div>
  );
}

export function EmployeeInsightSummary({ features }: Props) {
  if (!features) return null;

  const maxOnaPercentile = getMaxOnaPercentile(features);

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryItem
        label="Desempeño actual"
        value={formatNumber(features.current_evaluation_score_normalized)}
        helper="Última evaluación normalizada"
      />

      <SummaryItem
        label="Delta desempeño"
        value={formatNumber(features.performance_delta_normalized)}
        helper="Vs. evaluación anterior"
      />

      <SummaryItem
        label="Percentil ONA destacado"
        value={formatNumber(maxOnaPercentile)}
        helper="Máximo percentil ONA disponible"
      />

      <SummaryItem
        label="Relaciones ONA"
        value={String(features.unique_relations ?? 0)}
        helper="Relaciones únicas detectadas"
      />
    </section>
  );
}
