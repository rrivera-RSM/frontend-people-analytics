"use client";

import type { EmployeeRow } from "@/components/EmployeeCard";
import EmployeeProgressChart from "@/components/EvaluationGraph";
import OnaRadarChart from "./ActiveOnaRadarChart";
import { SalaryProposalForm } from "./SalaryProposalForm";
import { useEffect, useState, useMemo } from "react";
import { KpiBar } from "./EmployeeKPIs";
import { computeProposalKpis } from "@/types/kpis";
import type { ProposalDraft, SimulationResult } from "@/types/compensation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InsightChipsInline } from "@/components/employee-insights/InsightChipsInline";
import { Download, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { EmployeeInsightsDeck } from "@/components/employee-insights/EmployeeInsightsDeck";
import { AttritionGauge } from "@/components/AttritionGauge";
import { EmployeeInsightCard } from "@/components/employee-insights/EmployeeInsightCard";
import { OnaOrganizationGraph } from "./OnaOrganizationGraph";

import type {
  EmployeeInsightsResponseApi,
  EmployeeInsightCode,
} from "@/types/employee-insights";
import { mapInsightsToViewModels } from "@/lib/employee-insights";

type Props = {
  employee: EmployeeRow | null;
};

export type MonetaryInfo = {
  salary: number;
  bonus: number;
};

export type OnaData = {
  percentile_1: number;
  percentile_2: number;
  percentile_3: number;
  percentile_4: number;
  closeness_centrality: number;
  betweenness_centrality: number;
  degree_centrality: number;
  eigenvector_centrality: number;
  ona_influence_id: number;
  ona_category_id: number;
};

type EmployeeTab = "decision-intelligence" | "ona" | "desempeno";

const AVG = { avgSalary: 30000, avgBonus: 2000 };

const fetchApi = async <T,>(url: string): Promise<T | null> => {
  try {
    const res = await fetch(url, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch (error) {
    console.error(`Fetch error: ${url}`, error);
    return null;
  }
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

const PERFORMANCE_CHART_CODES = new Set<EmployeeInsightCode>([
  "high_solid_performance",
  "hidden_risk",
  "potential",
  "stagnant",
  "recovery",
  "critical",
]);

const ONA_CHART_CODES = new Set<EmployeeInsightCode>([
  "active_influence_ci",
  "active_influence_at",
  "active_influence_ap",
  "active_influence_in",
]);

const TALENT_KPI_CODES = new Set<EmployeeInsightCode>([
  "high_talent",
  "high_potential",
  "high_performer",
  "high_underrecognized",
]);

function getInitials(employee: EmployeeRow) {
  const first = employee.first_name?.trim()?.[0] ?? "";
  const last = employee.last_name?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "--";
}

function parseDateSafe(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTenureLabel(joinedAt?: string | null) {
  const joined = parseDateSafe(joinedAt);
  if (!joined) return null;

  const now = new Date();
  let years = now.getFullYear() - joined.getFullYear();
  let months = now.getMonth() - joined.getMonth();

  if (now.getDate() < joined.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0) {
    return months <= 0
      ? "Menos de 1 mes en la firma"
      : `${months} ${months === 1 ? "mes" : "meses"} en la firma`;
  }

  return `${years} ${years === 1 ? "año" : "años"} en la firma`;
}

function normalizeAttritionRate(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value <= 1 ? value * 100 : value;
}

export function EmployeeView({ employee }: Props) {
  const [monetaryInfo, setMonetaryInfo] = useState<MonetaryInfo | null>(null);
  const [onaData, setOnaData] = useState<OnaData | null>(null);
  const [insightsData, setInsightsData] =
    useState<EmployeeInsightsResponseApi | null>(null);

  const [proposalDraft, setProposalDraft] = useState<ProposalDraft | null>(null);
  const [acceptedSimulation, setAcceptedSimulation] =
    useState<SimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState<EmployeeTab>("decision-intelligence");
  const [localSalary, setLocalSalary] = useState(0);
  const [localBonus, setLocalBonus] = useState(0);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee?.id) {
      setMonetaryInfo(null);
      setOnaData(null);
      setInsightsData(null);
      setProposalDraft(null);
      setAcceptedSimulation(null);
      setSimulationError(null);
      setSimulationResult(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    // limpiamos para evitar mostrar datos stale al cambiar de empleado
    setMonetaryInfo(null);
    setOnaData(null);
    setInsightsData(null);
    setProposalDraft(null);
    setAcceptedSimulation(null);
    setSimulationError(null);
    setSimulationResult(null);

    (async () => {
      const [monetary, ona, insights] = await Promise.all([
        fetchApi<MonetaryInfo>(`/api/employees/${employee.id}/monetary-info`),
        fetchApi<OnaData>(`/api/ona/${employee.id}/active`),
        fetchApi<EmployeeInsightsResponseApi>(
          `/api/employees/${employee.id}/insights`,
        ),
      ]);

      if (!isMounted) return;

      setMonetaryInfo(monetary ?? null);
      setOnaData(ona ?? null);
      setInsightsData(insights ?? null);
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [employee?.id]);

  useEffect(() => {
    if (!employee || !monetaryInfo) {
      setProposalDraft(null);
      return;
    }

    setProposalDraft({
      salaryCurrent: monetaryInfo.salary,
      proposedSalary: round2(monetaryInfo.salary * 1.02),
      bonus: monetaryInfo.bonus,
      category: employee.category_name ?? "",
    });
  }, [employee, monetaryInfo]);

  useEffect(() => {
    if (!proposalDraft) return;
    setLocalSalary(proposalDraft.proposedSalary);
    setLocalBonus(proposalDraft.bonus);
    setSimulationError(null);
    setSimulationResult(null);
  }, [proposalDraft]);

  const proposalKpis = useMemo(() => {
    if (!proposalDraft) return null;

    return computeProposalKpis(
      {
        salaryCurrent: proposalDraft.salaryCurrent,
        proposedSalary: proposalDraft.proposedSalary,
        bonus: proposalDraft.bonus,
      },
      AVG,
    );
  }, [proposalDraft]);

  const insightViewModels = useMemo(() => {
    return insightsData ? mapInsightsToViewModels(insightsData.insights) : [];
  }, [insightsData]);

  const performanceInsights = useMemo(() => {
    return insightViewModels.filter((insight) =>
      PERFORMANCE_CHART_CODES.has(insight.code),
    );
  }, [insightViewModels]);

  const onaInsights = useMemo(() => {
    return insightViewModels.filter((insight) =>
      ONA_CHART_CODES.has(insight.code),
    );
  }, [insightViewModels]);

  const talentInsight = useMemo(() => {
    return (
      insightViewModels.find((insight) => TALENT_KPI_CODES.has(insight.code)) ??
      null
    );
  }, [insightViewModels]);

  const mainOnaInsight = useMemo(() => {
    return (
      insightViewModels.find(
        (insight) =>
          insight.family === "ona" && !ONA_CHART_CODES.has(insight.code),
      ) ??
      onaInsights[0] ??
      null
    );
  }, [insightViewModels, onaInsights]);

  const visibleContextInsights = useMemo(() => {
    return insightViewModels.filter(
      (insight) =>
        !PERFORMANCE_CHART_CODES.has(insight.code) &&
        !ONA_CHART_CODES.has(insight.code),
    );
  }, [insightViewModels]);

  const executiveInsightCards = useMemo(() => {
    return [talentInsight, mainOnaInsight].filter(
      (insight, index, array): insight is NonNullable<typeof insight> =>
        Boolean(insight) &&
        array.findIndex((item) => item?.code === insight?.code) === index,
    );
  }, [mainOnaInsight, talentInsight]);

  const modalInsights = useMemo(() => {
    return insightViewModels.filter(
      (insight) =>
        !PERFORMANCE_CHART_CODES.has(insight.code) &&
        !ONA_CHART_CODES.has(insight.code) &&
        !TALENT_KPI_CODES.has(insight.code),
    );
  }, [insightViewModels]);

  const fullName = employee
    ? `${employee.first_name} ${employee.last_name}`.trim()
    : "Selecciona un empleado";

  const employeeMeta = useMemo(() => {
    if (!employee) return [];

    return [
      employee.category_name,
      employee.department_name,
      employee.office_name,
    ].filter(Boolean);
  }, [employee]);

  const tenureLabel = useMemo(
    () => getTenureLabel(employee?.joined_at),
    [employee?.joined_at],
  );

  const attritionPct = normalizeAttritionRate(employee?.attrition_rate);
  const attritionIsHigh = attritionPct != null && attritionPct >= 34.14;

  const raisePct =
    proposalDraft && proposalDraft.salaryCurrent > 0
      ? round1(((localSalary - proposalDraft.salaryCurrent) / proposalDraft.salaryCurrent) * 100)
      : 0;

  const displayedProbability = simulationResult?.attritionProbability ?? employee?.attrition_rate ?? null;

  const runSimulation = async () => {
    if (!employee || !proposalDraft) return;
    setSimulationLoading(true);
    setSimulationError(null);

    try {
      const payload = {
        employee_id: employee.id,
        new_salary: localSalary,
        new_bonus: localBonus,
        ...(proposalDraft.category ? { new_category: proposalDraft.category } : {}),
      };

      const res = await fetch("/api/predictive_attrition/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as
        | Array<{ id: number; probability: number; stays: boolean }>
        | { detail?: string };

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "detail" in data
            ? data.detail || "Error llamando a la simulación"
            : `Simulation failed with status ${res.status}`,
        );
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("La simulación no devolvió resultados");
      }

      const simulationItem = data.find((item) => item.id === employee.id) ?? data[0];
      if (typeof simulationItem.probability !== "number") {
        throw new Error("Respuesta de simulación inválida");
      }

      setSimulationResult({
        attritionProbability: simulationItem.probability,
        simulatedSalary: localSalary,
        simulatedBonus: localBonus,
        simulatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setSimulationError(
        err instanceof Error ? err.message : "No se pudo ejecutar la simulación",
      );
      setSimulationResult(null);
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <>
      <section className="min-w-0 flex-1 min-h-0 h-full overflow-y-auto border-l border-slate-200 bg-[var(--exec-bg)] [background-image:var(--exec-employee-view)] dark:border-slate-700/80">
        <div className="min-h-full flex flex-col">
          {/* Header */}
          <header className="shrink-0 border-b border-slate-200 bg-[var(--exec-top)] px-6 py-5 shadow-sm dark:border-slate-700/80 dark:bg-[#0f1728]">
            {!employee ? (
              <div className="flex min-h-[92px] items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Vista de empleado
                  </p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight">
                    {fullName}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-slate-300 bg-cyan-500 shadow-[0_0_0_3px_rgba(34,211,238,0.12)] dark:border-slate-700">
                    <AvatarImage
                      src={`/api/employees/${employee.id}/photo`}
                      alt={`${fullName} avatar`}
                    />
                    <AvatarFallback className="bg-cyan-500 text-lg font-bold text-white">
                      {getInitials(employee)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h1 className="truncate text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      {fullName}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      {employeeMeta.map((item) => (
                        <span
                          key={item}
                          className="border-r border-slate-300 pr-3 last:border-r-0 dark:border-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                      {tenureLabel && (
                        <span className="border-r border-slate-300 pr-3 last:border-r-0 dark:border-slate-700">
                          Seniority: {tenureLabel.replace(" en la firma", "")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  {attritionPct != null && (
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                        attritionIsHigh
                          ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      ].join(" ")}
                    >
                      Riesgo de fuga {attritionPct.toFixed(1)}%
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label="Descargar informe"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Más acciones"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-x-hidden p-6">
            {!employee ? (
              <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-white/80 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                Selecciona un empleado para ver detalles
              </div>
            ) : (
              <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
                <section>
                  <KpiBar
                    variant="summary"
                    raiseAmount={proposalKpis?.raiseAmount}
                    salaryVsAvgPct={proposalKpis?.salaryVsAvgPct}
                    bonusVsAvgPct={proposalKpis?.bonusVsAvgPct}
                    attritionRate={employee.attrition_rate}
                  />
                </section>

                {executiveInsightCards.length > 0 && (
                  <section className="rounded-xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                      Main insights
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {executiveInsightCards.map((insight) => (
                        <EmployeeInsightCard
                          key={insight.code}
                          insight={insight}
                          compact
                          maxVisibleEvidence={2}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {visibleContextInsights.length > 0 && (
                  <section className="rounded-xl border bg-[var(--exec-card)] p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold">
                          Señales detectadas
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Insights relevantes que no dependen de abrir la simulación.
                        </p>
                      </div>
                      <InsightChipsInline
                        insights={visibleContextInsights}
                        className="md:justify-end"
                      />
                    </div>
                  </section>
                )}

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <SalaryProposalForm
                    employee={employee}
                    monetaryInfo={monetaryInfo}
                    value={proposalDraft}
                    onChange={setProposalDraft}
                    hasInsights={modalInsights.length > 0}
                    onOpenSimulation={() => setActiveTab("decision-intelligence")}
                  />

                  <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white/85 shadow-sm dark:border-slate-700/90 dark:bg-slate-800/60">
                    <div className="flex border-b border-slate-200 bg-slate-50/75 dark:border-slate-700/90 dark:bg-slate-900/35">
                      <button
                        type="button"
                        onClick={() => setActiveTab("decision-intelligence")}
                        className={[
                          "px-6 py-3 text-sm",
                          activeTab === "decision-intelligence"
                            ? "border-b-2 border-cyan-500 font-semibold text-slate-900 dark:border-cyan-400 dark:text-slate-100"
                            : "font-medium text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        Decision intelligence
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("ona")}
                        className={[
                          "px-6 py-3 text-sm",
                          activeTab === "ona"
                            ? "border-b-2 border-cyan-500 font-semibold text-slate-900 dark:border-cyan-400 dark:text-slate-100"
                            : "font-medium text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        ONA
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("desempeno")}
                        className={[
                          "px-6 py-3 text-sm",
                          activeTab === "desempeno"
                            ? "border-b-2 border-cyan-500 font-semibold text-slate-900 dark:border-cyan-400 dark:text-slate-100"
                            : "font-medium text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        Desempeño
                      </button>
                    </div>

                    <div className="grid gap-5 p-6">
                      {activeTab === "decision-intelligence" && proposalDraft && (
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.02fr_0.98fr]">
                          <div className="space-y-4">
                            <Card className="bg-slate-50 dark:bg-slate-900/40">
                              <CardContent className="space-y-4 p-4">
                                <div className="space-y-1">
                                  <div className="text-sm text-slate-500 dark:text-slate-400">Categoría</div>
                                  <div className="font-medium">{proposalDraft.category || "-"}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Salario actual</div>
                                    <div className="font-medium">
                                      {new Intl.NumberFormat("es-ES", {
                                        style: "currency",
                                        currency: "EUR",
                                        minimumFractionDigits: 2,
                                      }).format(proposalDraft.salaryCurrent)}
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Incremento porcentual</div>
                                    <div className="font-medium text-cyan-700 dark:text-cyan-300">
                                      {raisePct >= 0 ? "+" : ""}
                                      {raisePct}%
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm text-slate-500 dark:text-slate-400">Nuevo salario bruto anual</div>
                                  <MoneyInput value={localSalary} onChange={setLocalSalary} />
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm text-slate-500 dark:text-slate-400">Cuantía del bonus (target anual)</div>
                                  <MoneyInput value={localBonus} onChange={setLocalBonus} />
                                </div>
                              </CardContent>
                            </Card>

                            <div className="flex gap-3">
                              <Button type="button" variant="secondary" onClick={runSimulation} disabled={simulationLoading}>
                                {simulationLoading ? "Simulando..." : "Ejecutar simulación"}
                              </Button>
                              <Button
                                type="button"
                                disabled={!simulationResult || simulationLoading}
                                onClick={() => {
                                  if (!simulationResult) return;
                                  setProposalDraft((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          proposedSalary: localSalary,
                                          bonus: localBonus,
                                        }
                                      : prev,
                                  );
                                  setAcceptedSimulation(simulationResult);
                                }}
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Card className="bg-slate-50 dark:bg-slate-900/40">
                              <CardContent className="space-y-4 p-4">
                                {simulationError && (
                                  <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                                    {simulationError}
                                  </div>
                                )}

                                {displayedProbability != null && (
                                  <AttritionGauge
                                    probability={displayedProbability}
                                    minSize={350}
                                    maxSize={350}
                                    label={
                                      simulationResult
                                        ? "Riesgo estimado tras simulación"
                                        : "Riesgo actual estimado"
                                    }
                                  />
                                )}
                              </CardContent>
                            </Card>

                            {modalInsights.length > 0 && (
                              <EmployeeInsightsDeck
                                insights={modalInsights}
                                autoPlay
                                autoPlayIntervalMs={8500}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "ona" && (
                        <>
                          <OnaOrganizationGraph
                            employeeId={employee.id}
                            societyId={employee.society_id ?? null}
                          />

                          <OnaRadarChart
                            data={onaData}
                            loading={loading}
                            insights={onaInsights}
                          />
                        </>
                      )}

                      {activeTab === "desempeno" && (
                        <EmployeeProgressChart
                          employeeId={employee?.id}
                          insights={performanceInsights}
                        />
                      )}
                    </div>
                  </div>
                </section>

                {acceptedSimulation && (
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-100">
                    Última simulación confirmada: riesgo estimado{" "}
                    <span className="font-semibold">
                      {(acceptedSimulation.attritionProbability * 100).toFixed(1)}%
                    </span>{" "}
                    con salario{" "}
                    <span className="font-semibold">
                      {new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 2,
                      }).format(acceptedSimulation.simulatedSalary)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

    </>
  );
}
