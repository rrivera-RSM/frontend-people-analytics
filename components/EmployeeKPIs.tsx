type DeltaTone = "up" | "down" | "neutral" | "danger" | "success";

type MetricCardProps = {
  label: string;
  value: string;
  valueTone?: DeltaTone;
  helperText?: string;
};

function MetricCard({
  label,
  value,
  valueTone = "neutral",
  helperText,
}: MetricCardProps) {
  const valueToneClasses: Record<DeltaTone, string> = {
    up: "text-emerald-600 dark:text-emerald-400",
    down: "text-rose-600 dark:text-rose-400",
    success: "text-emerald-600 dark:text-emerald-400",
    danger: "text-rose-600 dark:text-rose-400",
    neutral: "text-foreground",
  };

  const helperToneClasses: Record<DeltaTone, string> = {
    up: "text-emerald-600/80 dark:text-emerald-400/80",
    down: "text-rose-600/80 dark:text-rose-400/80",
    success: "text-emerald-600/80 dark:text-emerald-400/80",
    danger: "text-rose-600/80 dark:text-rose-400/80",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="rounded-xl border bg-[var(--exec-card)] p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">
        {label}
      </div>

      <div
        className={`mt-1 text-lg font-semibold tracking-tight ${valueToneClasses[valueTone]}`}
      >
        {value}
      </div>

      {helperText && (
        <div className={`mt-1 text-xs font-medium ${helperToneClasses[valueTone]}`}>
          {helperText}
        </div>
      )}
    </div>
  );
}

export type KpiBarProps = {
  raiseAmount?: number | null;
  salaryVsAvgPct?: number | null;
  bonusVsAvgPct?: number | null;
  performanceLabel?: string;
  attritionRate?: number | null;
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
  return pct >= ATTRITION_THRESHOLD_PCT ? "Riesgo alto" : "Riesgo controlado";
};

export function KpiBar({
  raiseAmount,
  salaryVsAvgPct,
  bonusVsAvgPct,
  attritionRate,
}: KpiBarProps) {
  const normalizedAttritionPct = isNum(attritionRate)
    ? normalizeAttritionRate(attritionRate)
    : null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Aumento propuesto"
        value={isNum(raiseAmount) ? eur.format(raiseAmount) : "—"}
      />

      <MetricCard
        label="% vs salario promedio"
        value={isNum(salaryVsAvgPct) ? fmtPct(salaryVsAvgPct) : "—"}
        valueTone={
          isNum(salaryVsAvgPct) ? toneFromNumber(salaryVsAvgPct) : "neutral"
        }
      />

      <MetricCard
        label="% vs bonus promedio"
        value={isNum(bonusVsAvgPct) ? fmtPct(bonusVsAvgPct) : "—"}
        valueTone={
          isNum(bonusVsAvgPct) ? toneFromNumber(bonusVsAvgPct) : "neutral"
        }
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
        
      />
    </div>
  );
}