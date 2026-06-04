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

type InsightNarrative = {
  text: string | null;
  consumedKeys: string[];
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

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isChartInsight(code: EmployeeInsightViewModel["code"]) {
  return (
    code === "high_solid_performance" ||
    code === "hidden_risk" ||
    code === "potential" ||
    code === "stagnant" ||
    code === "recovery" ||
    code === "critical" ||
    code === "active_influence_ci" ||
    code === "active_influence_at" ||
    code === "active_influence_ap" ||
    code === "active_influence_in"
  );
}

function buildInsightNarrative(insight: EmployeeInsightViewModel): InsightNarrative {
  const evidence = insight.evidence;

  switch (insight.code) {
    case "low_level_influence":
    case "lower_level_influence": {
      const count = readNumber(evidence.n_lower_categories_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir relaciones entrantes de ${formatEvidenceValue(count)} personas pertenecientes a categorias organizativas inferiores a la suya.`,
        consumedKeys: ["formula_description", "n_lower_categories_in", "threshold"],
      };
    }
    case "peer_level_influence": {
      const count = readNumber(evidence.n_same_category_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir relaciones entrantes de ${formatEvidenceValue(count)} personas de su misma categoria o de categorias equivalentes.`,
        consumedKeys: ["formula_description", "n_same_category_in", "threshold"],
      };
    }
    case "transversal_leadership": {
      const count = readNumber(evidence.n_different_categories_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir reconocimiento desde ${formatEvidenceValue(count)} categorias organizativas distintas y situarse entre los perfiles con mayor volumen de conexiones en su grupo de referencia.`,
        consumedKeys: [
          "formula_description",
          "n_different_categories_in",
          "n_same_dept_office_in_no_ci",
          "threshold",
        ],
      };
    }
    case "active_influence_ci":
    case "active_influence_at":
    case "active_influence_ap":
    case "active_influence_in": {
      const percentileKey = {
        active_influence_ci: "ona_percentile_1",
        active_influence_at: "ona_percentile_2",
        active_influence_ap: "ona_percentile_3",
        active_influence_in: "ona_percentile_4",
      }[insight.code];
      const percentile = readNumber(evidence[percentileKey]);
      if (percentile == null) break;
      return {
        text: `Se ha identificado al situarse en un percentil de ${formatEvidenceValue(percentile)}, dentro del tramo alto de esta dimension de ONA activo.`,
        consumedKeys: ["threshold", percentileKey],
      };
    }
    case "high_solid_performance":
    case "hidden_risk":
    case "potential":
    case "stagnant":
    case "recovery":
    case "critical": {
      const score = readNumber(evidence.current_score_normalized);
      const delta = readNumber(evidence.delta);
      const highThreshold = readNumber(evidence.high_threshold);
      const mediumThreshold = readNumber(evidence.medium_threshold);
      if (score == null || highThreshold == null || mediumThreshold == null) break;

      const bandText =
        score >= highThreshold
          ? "en el tramo alto"
          : score >= mediumThreshold
            ? "en el tramo medio"
            : "en el tramo bajo";
      const deltaText =
        delta == null
          ? ""
          : delta > 0
            ? ` y una mejora de ${formatEvidenceValue(delta)} puntos`
            : delta < 0
              ? ` y una caida de ${formatEvidenceValue(Math.abs(delta))} puntos`
              : " y una evolucion estable";

      return {
        text: `Se ha identificado al situarse con un score de ${formatEvidenceValue(score)} ${bandText}${deltaText}.`,
        consumedKeys: [
          "current_score_normalized",
          "previous_score_normalized",
          "delta",
          "performance_band",
          "performance_trend",
          "high_threshold",
          "medium_threshold",
          "trend_threshold",
        ],
      };
    }
    default:
      break;
  }

  return { text: null, consumedKeys: [] };
}

function InsightChip({
  insight,
  maxVisibleEvidence = 3,
}: {
  insight: EmployeeInsightViewModel;
  maxVisibleEvidence?: number;
}) {
  const narrative = buildInsightNarrative(insight);
  const useNarrativeAsDescription = isChartInsight(insight.code) && Boolean(narrative.text);
  const hiddenEvidenceKeys = new Set([...narrative.consumedKeys, "formula_description"]);
  const preferredEntries =
    insight.visibleEvidenceKeys.length > 0
      ? insight.visibleEvidenceKeys
          .filter((key) => key in insight.evidence && !hiddenEvidenceKeys.has(key))
          .map((key) => [key, insight.evidence[key]] as const)
          .slice(0, maxVisibleEvidence)
      : Object.entries(insight.evidence)
          .filter(([key]) => !hiddenEvidenceKeys.has(key))
          .slice(0, maxVisibleEvidence);

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

          <div className="rounded-lg bg-slate-950/8 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">
            {insight.shortCode}
          </div>
        </div>

        <h4 className="mt-4 text-lg font-semibold">{insight.title}</h4>

        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
          {useNarrativeAsDescription ? narrative.text : insight.description}
        </p>

        {preferredEntries.length > 0 && (
          <dl className="mt-4 space-y-2 rounded-xl bg-slate-950/5 p-3 dark:bg-white/5">
            {preferredEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <dt className="text-slate-500 dark:text-slate-400">{prettifyKey(key)}</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-50">
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
