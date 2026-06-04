import { ArrowDownRight, ArrowUpRight, Zap } from "lucide-react";

type DeltaTone = "up" | "down" | "neutral" | "danger" | "success";

type MetricCardProps = {
  label: string;
  value: string;
  valueTone?: DeltaTone;
  helperText?: string;
  compact?: boolean;
};

function MetricCard({
  label,
  value,
  valueTone = "neutral",
  helperText,
  compact = false,
}: MetricCardProps) {
  const valueToneClasses: Record<DeltaTone, string> = {
    up: "text-[var(--rsm-blue)] dark:text-[#79d7ff]",
    down: "text-[var(--rsm-red)] dark:text-[#ff9ab8]",
    success: "text-[var(--rsm-green)] dark:text-[#8ed989]",
    danger: "text-[var(--rsm-red)] dark:text-[#ff9ab8]",
    neutral: "text-slate-900 dark:text-slate-50",
  };

  const helperToneClasses: Record<DeltaTone, string> = {
    up: "text-[color:rgb(var(--rsm-green-rgb)/0.82)] dark:text-[#8ed989]",
    down: "text-[color:rgb(var(--rsm-red-rgb)/0.82)] dark:text-[#ff9ab8]",
    success: "text-[color:rgb(var(--rsm-green-rgb)/0.82)] dark:text-[#8ed989]",
    danger: "text-[color:rgb(var(--rsm-red-rgb)/0.82)] dark:text-[#ff9ab8]",
    neutral: "text-slate-500 dark:text-slate-400",
  };

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
          } ${helperToneClasses[valueTone]}`}
        >
          {helperText}
        </div>
      )}
    </div>
  );
}

export type KpiBarProps = {
  currentSalary?: number | null;
  currentBonus?: number | null;
  raiseAmount?: number | null;
  salaryVsAvgPct?: number | null;
  bonusVsAvgPct?: number | null;
  performanceLabel?: string;
  attritionRate?: number | null;
  variant?: "summary" | "cards";
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

const getAttritionHelperText = (pct: number): string => {
  return pct >= ATTRITION_THRESHOLD_PCT
    ? "Por encima del umbral de atención"
    : "Por debajo del umbral de atención";
};

export function KpiBar({
  currentSalary,
  currentBonus,
  raiseAmount,
  salaryVsAvgPct,
  bonusVsAvgPct,
  attritionRate,
  variant = "cards",
}: KpiBarProps) {
  const normalizedAttritionPct = isNum(attritionRate)
    ? normalizeAttritionRate(attritionRate)
    : null;

  if (variant === "summary") {
    return (
      <section className="rounded-xl border border-slate-200 bg-[var(--exec-card)] shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35">
        <div className="border-l-4 border-[var(--rsm-blue)] px-6 py-5">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            <Zap className="h-4 w-4 text-[var(--rsm-blue)] dark:text-[#79d7ff]" />
            Executive Summary
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
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

            <MetricCard
              compact
              label="Brecha Salarial (Mercado)"
              value={isNum(salaryVsAvgPct) ? fmtPct(salaryVsAvgPct) : "-"}
              valueTone={
                isNum(salaryVsAvgPct)
                  ? salaryVsAvgPct < 0
                    ? "down"
                    : "up"
                  : "neutral"
              }
              helperText={
                isNum(raiseAmount)
                  ? `Aumento propuesto: ${eur.format(raiseAmount)}`
                  : undefined
              }
            />

            <MetricCard
              compact
              label="% vs Bonus Promedio"
              value={isNum(bonusVsAvgPct) ? fmtPct(bonusVsAvgPct) : "-"}
              valueTone={
                isNum(bonusVsAvgPct)
                  ? bonusVsAvgPct < 0
                    ? "down"
                    : "up"
                  : "neutral"
              }
              helperText="Comparado con la referencia de bonus"
            />

            <MetricCard
              compact
              label="Aumento Propuesto"
              value={isNum(raiseAmount) ? eur.format(raiseAmount) : "-"}
              helperText="Diferencia frente al salario actual"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Aumento propuesto"
        value={isNum(raiseAmount) ? eur.format(raiseAmount) : "—"}
        helperText="Diferencia frente al salario actual"
      />

      <MetricCard
        label="% vs salario promedio"
        value={isNum(salaryVsAvgPct) ? fmtPct(salaryVsAvgPct) : "—"}
        valueTone={
          isNum(salaryVsAvgPct) ? toneFromNumber(salaryVsAvgPct) : "neutral"
        }
        helperText="Comparado con la referencia salarial"
      />

      <MetricCard
        label="% vs bonus promedio"
        value={isNum(bonusVsAvgPct) ? fmtPct(bonusVsAvgPct) : "—"}
        valueTone={
          isNum(bonusVsAvgPct) ? toneFromNumber(bonusVsAvgPct) : "neutral"
        }
        helperText="Comparado con la referencia de bonus"
      />

      <MetricCard
        label="Probabilidad de fuga"
        value={
          isNum(normalizedAttritionPct)
            ? fmtPlainPct(normalizedAttritionPct)
            : "—"
        }
        valueTone={
          isNum(normalizedAttritionPct)
            ? getAttritionTone(normalizedAttritionPct)
            : "neutral"
        }
        helperText={
          isNum(normalizedAttritionPct)
            ? getAttritionHelperText(normalizedAttritionPct)
            : undefined
        }
      />
    </div>
  );
}
