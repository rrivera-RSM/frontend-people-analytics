import { EMPLOYEE_INSIGHT_DEFINITIONS } from "@/config/employee-insight-definitions";
import type {
  EmployeeInsightCode,
  EmployeeInsightDefinition,
  EmployeeInsightFeaturesApi,
  EmployeeInsightItemApi,
  EmployeeInsightViewModel,
  InsightFamily,
  InsightTone,
} from "@/types/employee-insights";

function isKnownInsightCode(
  code: EmployeeInsightCode,
): code is keyof typeof EMPLOYEE_INSIGHT_DEFINITIONS {
  return code in EMPLOYEE_INSIGHT_DEFINITIONS;
}

function buildFallbackDefinition(
  code: EmployeeInsightCode,
  family: InsightFamily,
): Omit<EmployeeInsightDefinition, "code"> {
  const fallbackTone: InsightTone =
    family === "performance"
      ? "success"
      : family === "ona"
        ? "info"
        : "neutral";

  return {
    shortCode: "UNK",
    family,
    tone: fallbackTone,
    chipLabel: String(code),
    title: String(code),
    description: "",
    chipClassName:
      "border-slate-400/30 bg-slate-400/10 text-slate-200 hover:bg-slate-400/15",
    chipDotClassName: "bg-slate-300",
    cardClassName:
      "border-slate-400/20 bg-slate-500/10 text-slate-50",
    badgeClassName:
      "border-slate-400/30 bg-slate-400/10 text-slate-200",
    visibleEvidenceKeys: [],
    sortOrder: 999,
  };
}

export function getEmployeeInsightDefinition(
  code: EmployeeInsightCode,
  family: InsightFamily,
): Omit<EmployeeInsightDefinition, "code"> {
  if (isKnownInsightCode(code)) {
    const { code: _code, ...definition } = EMPLOYEE_INSIGHT_DEFINITIONS[code];
    return definition;
  }

  return buildFallbackDefinition(code, family);
}

export function mapInsightToViewModel(
  item: EmployeeInsightItemApi,
): EmployeeInsightViewModel {
  const definition = getEmployeeInsightDefinition(item.code, item.family);

  return {
    code: item.code,
    family: item.family,
    tone: definition.tone,
    shortCode: definition.shortCode,
    chipLabel: definition.chipLabel,
    title: item.title ?? definition.title,
    description: item.description ?? definition.description,
    priority: item.priority,
    evidence: item.evidence ?? {},
    chipClassName: definition.chipClassName,
    chipDotClassName: definition.chipDotClassName,
    cardClassName: definition.cardClassName,
    badgeClassName: definition.badgeClassName,
    visibleEvidenceKeys: definition.visibleEvidenceKeys ?? [],
  };
}

export function mapInsightsToViewModels(
  items: EmployeeInsightItemApi[],
): EmployeeInsightViewModel[] {
  return items.map(mapInsightToViewModel).sort((a, b) => a.priority - b.priority);
}

export function splitInsightsByFamily(items: EmployeeInsightViewModel[]) {
  return {
    talent: items.filter((item) => item.family === "talent"),
    performance: items.filter((item) => item.family === "performance"),
    ona: items.filter((item) => item.family === "ona"),
  };
}

export function getTopInsights(
  items: EmployeeInsightViewModel[],
  limit = 5,
): EmployeeInsightViewModel[] {
  return [...items].sort((a, b) => a.priority - b.priority).slice(0, limit);
}

export function getTopInsightsByFamily(
  items: EmployeeInsightViewModel[],
  family: InsightFamily,
  limit = 2,
): EmployeeInsightViewModel[] {
  return items
    .filter((item) => item.family === family)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}

export function getMaxOnaPercentile(
  features: EmployeeInsightFeaturesApi | null | undefined,
): number | null {
  if (!features) return null;

  const values = [
    features.ona_percentile_1,
    features.ona_percentile_2,
    features.ona_percentile_3,
    features.ona_percentile_4,
  ].filter((value): value is number => typeof value === "number");

  if (!values.length) return null;
  return Math.max(...values);
}