
type DeltaTone = "up" | "down" | "neutral";

type MetricCardProps = {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
};

function MetricCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
}: MetricCardProps) {
  const toneClasses = {
    up: "text-emerald-600 bg-emerald-50 border-emerald-100",
    down: "text-rose-600 bg-rose-50 border-rose-100",
    neutral: "text-slate-600 bg-slate-50",
  };

  return (
    <div className="rounded-xl border p-4 shadow-sm bg-[var(--exec-card)]">
      <div className="text-xs font-medium">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
      {delta && (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mt-2 ${toneClasses[deltaTone]}`}
        >
          {delta}
        </span>
      )}
    </div>
  );
}

export type KpiBarProps = {
  raiseAmount?: number | null;
  salaryVsAvgPct?: number | null;
  bonusVsAvgPct?: number | null;
  performanceLabel?: string;
};

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toneFromNumber = (n: number): DeltaTone =>
  n > 0 ? "up" : n < 0 ? "down" : "neutral";

const fmtPct = (n: number) => {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
};

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

export function KpiBar({
  raiseAmount,
  salaryVsAvgPct,
  bonusVsAvgPct,
  performanceLabel = "Excelente",
}: KpiBarProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Aumento propuesto"
        value={isNum(raiseAmount) ? eur.format(raiseAmount) : "—"}
      />

      <MetricCard
        label="% vs salario promedio"
        value={isNum(salaryVsAvgPct) ? fmtPct(salaryVsAvgPct) : "—"}
        delta={isNum(salaryVsAvgPct) ? fmtPct(salaryVsAvgPct) : undefined}
        deltaTone={
          isNum(salaryVsAvgPct) ? toneFromNumber(salaryVsAvgPct) : "neutral"
        }
      />

      <MetricCard
        label="% vs bonus promedio"
        value={isNum(bonusVsAvgPct) ? fmtPct(bonusVsAvgPct) : "—"}
        delta={isNum(bonusVsAvgPct) ? fmtPct(bonusVsAvgPct) : undefined}
        deltaTone={
          isNum(bonusVsAvgPct) ? toneFromNumber(bonusVsAvgPct) : "neutral"
        }
      />

      <MetricCard label="Desempeño" value={performanceLabel} />
    </div>
  );
}
