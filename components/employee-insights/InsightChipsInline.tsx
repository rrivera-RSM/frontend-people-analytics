"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { EmployeeInsightViewModel } from "@/types/employee-insights";

type Props = {
  insights: EmployeeInsightViewModel[];
  emptyText?: string;
  maxVisibleEvidence?: number;
  className?: string;
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

function InsightChip({
  insight,
  maxVisibleEvidence = 3,
}: {
  insight: EmployeeInsightViewModel;
  maxVisibleEvidence?: number;
}) {
  const preferredEntries =
    insight.visibleEvidenceKeys.length > 0
      ? insight.visibleEvidenceKeys
          .filter((key) => key in insight.evidence)
          .map((key) => [key, insight.evidence[key]] as const)
      : Object.entries(insight.evidence).slice(0, maxVisibleEvidence);

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${insight.chipClassName}`}
        >
          {insight.chipDotClassName && (
            <span className={`h-2 w-2 rounded-full ${insight.chipDotClassName}`} />
          )}
          <span>{insight.chipLabel}</span>
          <span className="opacity-">[{insight.shortCode}]</span>
        </button>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="start"
        className={`w-[320px] rounded-2xl border p-4 shadow-xl ${insight.cardClassName}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${insight.badgeClassName}`}
          >
            Insight {insight.family.toUpperCase()}
          </div>

          <div className="rounded-lg bg-black/10 px-2 py-1 text-[11px] font-semibold">
            {insight.shortCode}
          </div>
        </div>

        <h4 className="mt-4 text-lg font-semibold">{insight.title}</h4>

        <p className="mt-2 text-sm leading-6 text-white/85">
          {insight.description}
        </p>

        {preferredEntries.length > 0 && (
          <dl className="mt-4 space-y-2 rounded-xl bg-black/10 p-3">
            {preferredEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <dt className="text-white/70">{prettifyKey(key)}</dt>
                <dd className="font-semibold text-white">
                  {formatEvidenceValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export function InsightChipsInline({
  insights,
  emptyText,
  maxVisibleEvidence = 3,
  className = "",
}: Props) {
  if (!insights.length) {
    if (!emptyText) return null;

    return <div className={`text-xs text-slate-400 ${className}`}>{emptyText}</div>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {insights.map((insight) => (
        <InsightChip
          key={`${insight.code}-${insight.priority}`}
          insight={insight}
          maxVisibleEvidence={maxVisibleEvidence}
        />
      ))}
    </div>
  );
}