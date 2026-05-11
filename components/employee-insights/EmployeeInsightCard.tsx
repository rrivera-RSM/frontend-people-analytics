"use client";

import type { EmployeeInsightViewModel } from "@/types/employee-insights";

type Props = {
  insight: EmployeeInsightViewModel;
  maxVisibleEvidence?: number;
  compact?: boolean;
};

function formatEvidenceValue(value: unknown): string {
  if (value == null) return "—";

  if (typeof value === "number") {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && value.includes("T")) {
      return date.toLocaleDateString("es-ES");
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
}

function prettifyKey(key: string) {
  return key.replaceAll("_", " ");
}

export function EmployeeInsightCard({
  insight,
  maxVisibleEvidence = 3,
  compact = false,
}: Props) {
  const evidenceEntries =
    insight.visibleEvidenceKeys.length > 0
      ? insight.visibleEvidenceKeys
          .filter((key) => key in insight.evidence)
          .map((key) => [key, insight.evidence[key]] as const)
          .slice(0, maxVisibleEvidence)
      : Object.entries(insight.evidence).slice(0, maxVisibleEvidence);

  return (
    <article
      className={`
        rounded-2xl border p-4
        ${insight.cardClassName}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${insight.badgeClassName}`}
        >
          Insight {insight.family.toUpperCase()}
        </div>

        <div className="rounded-lg bg-slate-900/8 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">
          {insight.shortCode}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2">
        {insight.chipDotClassName && (
          <span
            className={`mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full ${insight.chipDotClassName}`}
          />
        )}

        <div className="min-w-0">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {insight.title}
          </h4>

          <p
            className={`mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200 ${
              compact ? "line-clamp-3" : ""
            }`}
          >
            {insight.description}
          </p>
        </div>
      </div>

      {evidenceEntries.length > 0 && (
        <dl className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-900/5 p-3 dark:bg-white/5">
          {evidenceEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <dt className="text-slate-500 dark:text-slate-400">
                {prettifyKey(key)}
              </dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-50">
                {formatEvidenceValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}