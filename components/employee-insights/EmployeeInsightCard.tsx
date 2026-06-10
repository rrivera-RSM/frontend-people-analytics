"use client";

import type { EmployeeInsightViewModel } from "@/types/employee-insights";

type Props = {
  insight: EmployeeInsightViewModel;
  maxVisibleEvidence?: number;
  compact?: boolean;
  className?: string;
};

type InsightNarrative = {
  text: string | null;
  consumedKeys: string[];
};

type ActiveInfluenceCode =
  | "active_influence_ci"
  | "active_influence_at"
  | "active_influence_ap"
  | "active_influence_in";

const ACTIVE_INFLUENCE_PERCENTILE_KEYS: Record<ActiveInfluenceCode, string> = {
  active_influence_ci: "ona_percentile_1",
  active_influence_at: "ona_percentile_2",
  active_influence_ap: "ona_percentile_3",
  active_influence_in: "ona_percentile_4",
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

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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
  const formulaFromEvidence =
    typeof evidence.formula_description === "string"
      ? evidence.formula_description
      : null;
  const baseFormula = formulaFromEvidence ?? insight.formulaDescription ?? null;

  switch (insight.code) {
    case "low_level_influence":
    case "lower_level_influence": {
      const count = readNumber(evidence.n_lower_categories_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir relaciones entrantes de ${pluralize(count, "persona", "personas")} pertenecientes a categorias organizativas inferiores a la suya.`,
        consumedKeys: ["formula_description", "n_lower_categories_in", "threshold"],
      };
    }
    case "upward_influence": {
      const count = readNumber(evidence.n_upper_categories_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir relaciones entrantes de ${pluralize(count, "persona", "personas")} pertenecientes a categorias organizativas superiores a la suya.`,
        consumedKeys: ["formula_description", "n_upper_categories_in", "threshold"],
      };
    }
    case "lateral_influence":
    case "peer_level_influence": {
      const count = readNumber(evidence.n_same_category_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir relaciones entrantes de ${pluralize(count, "persona", "personas")} de su misma categoria o de categorias equivalentes.`,
        consumedKeys: ["formula_description", "n_same_category_in", "threshold"],
      };
    }
    case "transversal_influence":
    case "transversal_leadership":
    case "strong_transversal_leadership": {
      const count = readNumber(evidence.n_different_categories_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir reconocimiento desde ${pluralize(count, "categoria organizativa distinta", "categorias organizativas distintas")}.`,
        consumedKeys: [
          "formula_description",
          "n_different_categories_in",
          "threshold",
          "min_n_different_categories_in",
          "p80_n_different_categories_in",
        ],
      };
    }
    case "team_connector": {
      const count = readNumber(evidence.n_different_categories_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir reconocimiento desde ${pluralize(count, "categoria organizativa distinta", "categorias organizativas distintas")} dentro de su grupo de referencia.`,
        consumedKeys: [
          "formula_description",
          "n_different_categories_in",
          "min_n_different_categories_in",
          "p80_n_different_categories_in",
        ],
      };
    }
    case "organizational_connector":
    case "bridge_person": {
      const count = readNumber(evidence.n_different_departments_in);
      if (count == null) break;
      return {
        text: `Se ha identificado al recibir relaciones entrantes desde ${pluralize(count, "departamento distinto", "departamentos distintos")}.`,
        consumedKeys: [
          "formula_description",
          "n_different_departments_in",
          "threshold",
          "min_n_different_departments_in",
          "p80_n_different_departments_in",
        ],
      };
    }
    case "high_team_trust": {
      const count = readNumber(evidence.n_same_dept_office_in_no_ci);
      if (count == null) break;
      return {
        text: `Se ha identificado al concentrar ${pluralize(count, "nominacion", "nominaciones")} dentro de su propio entorno de Departamento y Oficina, situandose entre los perfiles mas reconocidos de su grupo de referencia.`,
        consumedKeys: [
          "formula_description",
          "n_same_dept_office_in_no_ci",
          "p80_n_same_dept_office_in_no_ci",
          "min_n_same_dept_office_in_no_ci",
          "min_n_respuestas",
          "min_tasa_respuestas",
        ],
      };
    }
    case "active_influence_ci":
    case "active_influence_at":
    case "active_influence_ap":
    case "active_influence_in": {
      const percentileKey =
        ACTIVE_INFLUENCE_PERCENTILE_KEYS[insight.code as ActiveInfluenceCode];
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
      const deltaText =
        delta == null
          ? ""
          : delta > 0
            ? ` y una mejora de ${formatEvidenceValue(delta)} puntos`
            : delta < 0
              ? ` y una caida de ${formatEvidenceValue(Math.abs(delta))} puntos`
              : " y una evolucion estable";
      const bandText =
        score >= highThreshold
          ? "en el tramo alto"
          : score >= mediumThreshold
            ? "en el tramo medio"
            : "en el tramo bajo";

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
    case "high_talent":
    case "high_potential":
    case "high_underrecognized":
    case "high_performer": {
      const score = readNumber(evidence.current_score_normalized);
      const threshold = readNumber(evidence.threshold);
      const category = typeof evidence.ona_primary_category === "string" ? evidence.ona_primary_category : null;
      if (score == null || threshold == null) break;
      const categoryText = category ? ` y una clasificacion ONA ${category}` : "";
      return {
        text: `Se ha identificado al registrar un score de ${formatEvidenceValue(score)}, en relacion con el umbral alto de ${formatEvidenceValue(threshold)}${categoryText}.`,
        consumedKeys: ["current_score_normalized", "ona_primary_category", "threshold"],
      };
    }
    default:
      break;
  }

  return {
    text: baseFormula,
    consumedKeys: baseFormula ? ["formula_description"] : [],
  };
}

export function EmployeeInsightCard({
  insight,
  maxVisibleEvidence = 3,
  compact = false,
  className = "",
}: Props) {
  const narrative = buildInsightNarrative(insight);
  const useNarrativeAsDescription = isChartInsight(insight.code) && Boolean(narrative.text);
  const hiddenEvidenceKeys = new Set([
    ...narrative.consumedKeys,
    "formula_description",
    "excluded_categories",
    "valid_influence_values",
  ]);

  const evidenceEntries =
    insight.visibleEvidenceKeys.length > 0
      ? insight.visibleEvidenceKeys
          .filter((key) => key in insight.evidence && !hiddenEvidenceKeys.has(key))
          .map((key) => [key, insight.evidence[key]] as const)
          .slice(0, maxVisibleEvidence)
      : Object.entries(insight.evidence)
          .filter(([key]) => !hiddenEvidenceKeys.has(key))
          .slice(0, maxVisibleEvidence);

  return (
    <article
      className={`
        rounded-2xl border p-4
        ${insight.cardClassName}
        ${className}
      `}
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
            {useNarrativeAsDescription ? narrative.text : insight.description}
          </p>

          {!useNarrativeAsDescription && narrative.text && (
            <p className="mt-2 text-sm italic leading-6 text-slate-500 dark:text-slate-400">
              {narrative.text}
            </p>
          )}
        </div>
      </div>

      {evidenceEntries.length > 0 && (
        <dl className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-slate-950/5 p-3 dark:bg-white/5">
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
