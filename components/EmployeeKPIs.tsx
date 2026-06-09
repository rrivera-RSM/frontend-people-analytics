import { ArrowDownRight, ArrowUpRight, Zap } from "lucide-react";
import type {
  SalaryProposalBenchmarkScope,
  SalaryProposalBenchmarkScopeKey,
} from "@/types/compensation";

type DeltaTone = "up" | "down" | "neutral" | "danger" | "success";
type HelperTone = DeltaTone | "info";

type MetricCardProps = {
  label: string;
  value: string;
  valueTone?: DeltaTone;
  helperTone?: HelperTone;
  helperText?: string;
  compact?: boolean;
};

function MetricCard({
  label,
  value,
  valueTone = "neutral",
  helperTone,
  helperText,
  compact = false,
}: MetricCardProps) {
  const valueToneClasses: Record<DeltaTone, string> = {
    up: "text-[var(--rsm-green)] dark:text-[#8ed989]",
    down: "text-[var(--rsm-red)] dark:text-[#ff9ab8]",
    success: "text-[var(--rsm-green)] dark:text-[#8ed989]",
    danger: "text-[var(--rsm-red)] dark:text-[#ff9ab8]",
    neutral: "text-slate-900 dark:text-slate-50",
  };

  const helperToneClasses: Record<HelperTone, string> = {
    up: "text-[color:rgb(var(--rsm-green-rgb)/0.82)] dark:text-[#8ed989]",
    down: "text-[color:rgb(var(--rsm-red-rgb)/0.82)] dark:text-[#ff9ab8]",
    success: "text-[color:rgb(var(--rsm-green-rgb)/0.82)] dark:text-[#8ed989]",
    danger: "text-[color:rgb(var(--rsm-red-rgb)/0.82)] dark:text-[#ff9ab8]",
    info: "text-[var(--rsm-blue)] dark:text-[#79d7ff]",
    neutral: "text-slate-500 dark:text-slate-400",
  };
  const resolvedHelperTone = helperTone ?? valueTone;

  const trendIcon =
    valueTone === "up" ? (
      <ArrowUpRight className={compact ? "h-4 w-4" : "h-4 w-4"} />
    ) : valueTone === "down" || valueTone === "danger" ? (
      <ArrowDownRight className={compact ? "h-4 w-4" : "h-4 w-4"} />
    ) : null;

  return (
    <div
      className={
        compact
          ? "min-w-0"
          : "rounded-lg border border-slate-200 bg-[var(--exec-card)] p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/50"
      }
    >
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </div>

      <div
        className={`mt-1 flex items-center gap-1 font-semibold tracking-tight ${
          compact ? "text-xl" : "text-lg"
        } ${valueToneClasses[valueTone]}`}
      >
        {trendIcon}
        <span>{value}</span>
      </div>

      {helperText && (
        <div
          className={`mt-1 text-xs font-medium ${
            compact ? "line-clamp-2 max-w-[260px] leading-5" : ""
          } ${helperToneClasses[resolvedHelperTone]}`}
        >
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
}

export type KpiBarProps = {
  currentSalary?: number | null;
  currentBonus?: number | null;
  attritionRate?: number | null;
  salaryVsAvgPct?: number | null;
  bonusVsAvgPct?: number | null;
  salaryIncreaseReference?: number | null;
  salaryIncreasePercentageReference?: number | null;
  bonusReference?: number | null;
  benchmarkScope?: SalaryProposalBenchmarkScope;
  availableBenchmarkScope?: SalaryProposalBenchmarkScope;
  onBenchmarkScopeChange?: (value: SalaryProposalBenchmarkScope) => void;
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ATTRITION_THRESHOLD_PCT = 34.14;

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const toneFromNumber = (n: number): DeltaTone =>
  n > 0 ? "up" : n < 0 ? "down" : "neutral";

const fmtPct = (n: number) => {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
};

const fmtPlainPct = (n: number) => `${n.toFixed(1)}%`;

const formatSalaryIncreaseReference = (
  salaryIncreaseReference?: number | null,
  salaryIncreasePercentageReference?: number | null,
) => {
  const hasAmount = isNum(salaryIncreaseReference);
  const hasPercentage = isNum(salaryIncreasePercentageReference);

  if (hasAmount && hasPercentage) {
    return `Ref. ${fmtPlainPct(
      salaryIncreasePercentageReference,
    )}  (${eur.format(salaryIncreaseReference)})`;
  }

  if (hasAmount) return `Ref. ${eur.format(salaryIncreaseReference)}`;
  if (hasPercentage) return `Ref. ${fmtPlainPct(salaryIncreasePercentageReference)}`;

  return "Sin referencia disponible";
};

const normalizeAttritionRate = (value: number) => {
  /**
   * Soporta ambos formatos:
   * - 0.3414 -> 34.14%
   * - 34.14  -> 34.14%
   */
  return value <= 1 ? value * 100 : value;
};

const getAttritionTone = (pct: number): DeltaTone => {
  return pct >= ATTRITION_THRESHOLD_PCT ? "danger" : "success";
};

const BENCHMARK_SCOPE_OPTIONS: Array<{
  key: SalaryProposalBenchmarkScopeKey;
  label: string;
}> = [
  { key: "society", label: "Sociedad" },
  { key: "department", label: "Depto." },
  { key: "office", label: "Oficina" },
  { key: "category", label: "Categoría" },
];

export function KpiBar({
  currentSalary,
  currentBonus,
  attritionRate,
  salaryVsAvgPct,
  bonusVsAvgPct,
  salaryIncreaseReference,
  salaryIncreasePercentageReference,
  bonusReference,
  benchmarkScope,
  availableBenchmarkScope,
  onBenchmarkScopeChange,
}: KpiBarProps) {
  const normalizedAttritionPct = isNum(attritionRate)
    ? normalizeAttritionRate(attritionRate)
    : null;
  const canEditBenchmarkScope =
    Boolean(benchmarkScope) &&
    Boolean(availableBenchmarkScope) &&
    Boolean(onBenchmarkScopeChange);

  const handleBenchmarkScopeToggle = (key: SalaryProposalBenchmarkScopeKey) => {
    if (!benchmarkScope || !availableBenchmarkScope || !onBenchmarkScopeChange) {
      return;
    }

    if (!availableBenchmarkScope[key]) return;

    onBenchmarkScopeChange({
      ...benchmarkScope,
      [key]: !benchmarkScope[key],
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-[var(--exec-card)] shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35">
      <div className="border-l-4 border-[var(--rsm-blue)] px-6 py-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            <Zap className="h-4 w-4 text-[var(--rsm-blue)] dark:text-[#79d7ff]" />
            Executive Summary
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {BENCHMARK_SCOPE_OPTIONS.map((option) => {
              const active = benchmarkScope?.[option.key] ?? false;
              const disabled =
                !canEditBenchmarkScope ||
                !(availableBenchmarkScope?.[option.key] ?? false);

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleBenchmarkScopeToggle(option.key)}
                  disabled={disabled}
                  className={[
                    "rounded-md border px-2 py-1 text-[11px] font-medium leading-none transition-colors",
                    active
                      ? "border-[var(--rsm-blue)] bg-[rgb(var(--rsm-blue-rgb)/0.12)] text-[var(--rsm-blue)] dark:border-[#79d7ff] dark:text-[#79d7ff]"
                      : "border-slate-300 bg-transparent text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
                    disabled
                      ? "cursor-not-allowed border-slate-200 text-slate-300 hover:bg-transparent dark:border-slate-800 dark:text-slate-600"
                      : "",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-6 md:grid-cols-3">
            <MetricCard
              compact
              label="Probabilidad de fuga"
              value={
                isNum(normalizedAttritionPct)
                  ? fmtPlainPct(normalizedAttritionPct)
                  : "-"
              }
              valueTone={
                isNum(normalizedAttritionPct)
                  ? getAttritionTone(normalizedAttritionPct)
                  : "neutral"
              }
              helperText={
                isNum(normalizedAttritionPct)
                  ? normalizedAttritionPct >= ATTRITION_THRESHOLD_PCT
                    ? "Alta"
                    : "Baja"
                  : undefined
              }
            />

            <MetricCard
              compact
              label="Salario actual"
              value={isNum(currentSalary) ? eur.format(currentSalary) : "-"}
              helperText="Compensación fija vigente"
            />

            <MetricCard
              compact
              label="Bonus actual"
              value={isNum(currentBonus) ? eur.format(currentBonus) : "-"}
              helperText="Bonus vigente registrado"
            />
          </div>

          <div className="min-w-0 border-t border-slate-200/80 pt-5 dark:border-slate-700/80 xl:w-[560px] xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <MetricCard
                compact
                label="% vs subida media"
                value={isNum(salaryVsAvgPct) ? fmtPct(salaryVsAvgPct) : "—"}
                valueTone={
                  isNum(salaryVsAvgPct)
                    ? toneFromNumber(salaryVsAvgPct)
                    : "neutral"
                }
                helperTone="info"
                helperText={
                  formatSalaryIncreaseReference(
                    salaryIncreaseReference,
                    salaryIncreasePercentageReference,
                  )
                }
              />

              <MetricCard
                compact
                label="% vs bonus promedio"
                value={isNum(bonusVsAvgPct) ? fmtPct(bonusVsAvgPct) : "—"}
                valueTone={
                  isNum(bonusVsAvgPct)
                    ? toneFromNumber(bonusVsAvgPct)
                    : "neutral"
                }
                helperTone="info"
                helperText={
                  isNum(bonusReference)
                    ? `Ref. ${eur.format(bonusReference)}`
                    : "Sin referencia disponible"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
