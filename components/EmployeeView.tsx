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
import { Eye, EyeOff, MoreVertical } from "lucide-react";
import { DecisionAttritionRiskPanel } from "@/components/DecisionAttritionRiskPanel";
import { DecisionInsightsCarousel } from "@/components/employee-insights/DecisionInsightsCarousel";
import { OnaOrganizationGraph } from "./OnaOrganizationGraph";
import { AnimatePresence, motion } from "framer-motion";
import { EmployeeTimelineEvolution } from "./EmployeeTimelineEvolution";

import type {
  EmployeeInsightsResponseApi,
  EmployeeInsightCode,
} from "@/types/employee-insights";
import { mapInsightsToViewModels } from "@/lib/employee-insights";
import {
  getDemoSensitiveImageClassName,
} from "@/lib/demo-mode";

type Props = {
  employee: EmployeeRow | null;
  demoMode?: boolean;
  onToggleDemoMode?: () => void;
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
const TAB_ORDER: EmployeeTab[] = ["decision-intelligence", "ona", "desempeno"];

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

const ONA_CHART_CODES = new Set<EmployeeInsightCode>([
  "active_influence_ci",
  "active_influence_at",
  "active_influence_ap",
  "active_influence_in",
]);

const DECISION_EXCLUDED_CODES = new Set<EmployeeInsightCode>([
  "high_solid_performance",
  "hidden_risk",
  "potential",
  "stagnant",
  "recovery",
  "critical",
  "active_influence_ci",
  "active_influence_at",
  "active_influence_ap",
  "active_influence_in",
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

const compactMoneyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatMoneyCompact(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return compactMoneyFormatter.format(value);
}

export function EmployeeView({
  employee,
  demoMode = false,
  onToggleDemoMode,
}: Props) {
  const [monetaryInfo, setMonetaryInfo] = useState<MonetaryInfo | null>(null);
  const [onaData, setOnaData] = useState<OnaData | null>(null);
  const [insightsData, setInsightsData] =
    useState<EmployeeInsightsResponseApi | null>(null);

  const [proposalDraft, setProposalDraft] = useState<ProposalDraft | null>(null);
  const [activeTab, setActiveTab] = useState<EmployeeTab>("decision-intelligence");
  const [tabDirection, setTabDirection] = useState(1);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [loading, setLoading] = useState(false);

  const handleTabChange = (nextTab: EmployeeTab) => {
    if (nextTab === activeTab) return;
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const nextIndex = TAB_ORDER.indexOf(nextTab);
    setTabDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (!employee?.id) {
      setMonetaryInfo(null);
      setOnaData(null);
      setInsightsData(null);
      setProposalDraft(null);
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
      currentBonus: monetaryInfo.bonus,
      currentCategory: employee.category_name ?? "",
      proposedSalary: round2(monetaryInfo.salary * 1.02),
      bonus: monetaryInfo.bonus,
      category: employee.category_name ?? "",
      includeBonus: monetaryInfo.bonus > 0,
      includeCategory: false,
    });
  }, [employee, monetaryInfo]);

  useEffect(() => {
    if (!proposalDraft) return;
    setSimulationError(null);
    setSimulationResult(null);
  }, [proposalDraft]);

  const proposalKpis = useMemo(() => {
    if (!proposalDraft) return null;

    const effectiveBonus = proposalDraft.includeBonus
      ? proposalDraft.bonus
      : proposalDraft.currentBonus ?? proposalDraft.bonus;

    return computeProposalKpis(
      {
        salaryCurrent: proposalDraft.salaryCurrent,
        proposedSalary: proposalDraft.proposedSalary,
        bonus: effectiveBonus,
      },
      AVG,
    );
  }, [proposalDraft]);

  const insightViewModels = useMemo(() => {
    return insightsData ? mapInsightsToViewModels(insightsData.insights) : [];
  }, [insightsData]);

  const onaInsights = useMemo(() => {
    return insightViewModels.filter((insight) =>
      ONA_CHART_CODES.has(insight.code),
    );
  }, [insightViewModels]);

  const decisionInsights = useMemo(() => {
    return insightViewModels.filter(
      (insight) => !DECISION_EXCLUDED_CODES.has(insight.code),
    );
  }, [insightViewModels]);

  const fullName = employee
    ? `${employee.first_name} ${employee.last_name}`.trim()
    : "Selecciona un empleado";

  const tenureLabel = useMemo(
    () => getTenureLabel(employee?.joined_at),
    [employee?.joined_at],
  );

  const attritionPct = normalizeAttritionRate(employee?.attrition_rate);
  const attritionIsHigh = attritionPct != null && attritionPct >= 34.14;
  const demoModeLabel = demoMode ? "Desactivar modo demo" : "Activar modo demo";
  const DemoModeIcon = demoMode ? EyeOff : Eye;

  const runSimulation = async () => {
    if (!employee || !proposalDraft || simulationLoading) return;
    setSimulationLoading(true);
    setSimulationError(null);

    try {
      const payload = {
        employee_id: employee.id,
        new_salary: proposalDraft.proposedSalary,
        ...(proposalDraft.includeBonus
          ? { new_bonus: proposalDraft.bonus }
          : {}),
        ...(proposalDraft.includeCategory && proposalDraft.category
          ? { new_category: proposalDraft.category }
          : {}),
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
        simulatedSalary: proposalDraft.proposedSalary,
        simulatedBonus: proposalDraft.includeBonus
          ? proposalDraft.bonus
          : proposalDraft.currentBonus ?? proposalDraft.bonus,
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
          <header className="shrink-0 border-b border-slate-200 bg-[var(--exec-top)] px-6 py-5 shadow-sm dark:border-slate-700/80 dark:bg-[var(--exec-top)]">
            {!employee ? (
              <div className="flex min-h-[92px] items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Vista de empleado
                  </p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight">
                    {fullName}
                  </h1>
                </div>
                <button
                  type="button"
                  aria-label={demoModeLabel}
                  title={demoModeLabel}
                  onClick={onToggleDemoMode}
                  className={[
                    "inline-flex h-12 w-12 items-center justify-center rounded-lg border transition-colors",
                    demoMode
                      ? "border-[var(--rsm-blue)] bg-[rgb(var(--rsm-blue-rgb)/0.12)] text-[var(--rsm-blue)] hover:bg-[rgb(var(--rsm-blue-rgb)/0.18)] dark:border-[#79d7ff] dark:text-[#79d7ff]"
                      : "border-slate-300 bg-[var(--exec-card)] text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  ].join(" ")}
                >
                  <DemoModeIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar
                    className={getDemoSensitiveImageClassName(
                      demoMode,
                      "h-16 w-16 border-2 border-slate-300 bg-[var(--rsm-blue)] shadow-[0_0_0_3px_rgba(0,156,222,0.14)] dark:border-slate-700",
                    )}
                  >
                    <AvatarImage
                      src={`/api/employees/${employee.id}/photo`}
                      alt={`${fullName} avatar`}
                    />
                    <AvatarFallback className="bg-[var(--rsm-blue)] text-lg font-bold text-white">
                      {getInitials(employee)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h1
                      className={[
                        "truncate text-3xl font-bold tracking-tight",
                        demoMode
                          ? "inline-flex max-w-full rounded-sm bg-slate-950 px-3 py-1 text-transparent shadow-[0_2px_0_rgba(15,23,42,0.18)] dark:bg-slate-100"
                          : "text-slate-900 dark:text-slate-50",
                      ].join(" ")}
                    >
                      {fullName}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      {demoMode ? (
                        <>
                          <span className="border-r border-slate-300 pr-3 font-medium text-[var(--rsm-blue)] last:border-r-0 dark:border-slate-700 dark:text-[#79d7ff]">
                            Salario: {formatMoneyCompact(monetaryInfo?.salary)}
                          </span>
                          <span className="border-r border-slate-300 pr-3 font-medium text-[var(--rsm-blue)] last:border-r-0 dark:border-slate-700 dark:text-[#79d7ff]">
                            Bonus: {formatMoneyCompact(monetaryInfo?.bonus)}
                          </span>
                        </>
                      ) : (
                        <>
                          {[employee.category_name, employee.department_name, employee.office_name]
                            .filter(Boolean)
                            .map((item) => (
                              <span
                                key={item}
                                className="border-r border-slate-300 pr-3 last:border-r-0 dark:border-slate-700"
                              >
                                {item}
                              </span>
                            ))}
                        </>
                      )}
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
                          ? "border-[color:rgb(var(--rsm-red-rgb)/0.3)] bg-[rgb(var(--rsm-red-rgb)/0.1)] text-[var(--rsm-red)] dark:text-[#ff9ab8]"
                          : "border-[color:rgb(var(--rsm-green-rgb)/0.3)] bg-[rgb(var(--rsm-green-rgb)/0.1)] text-[var(--rsm-green)] dark:text-[#8ed989]",
                      ].join(" ")}
                    >
                      Riesgo de fuga {attritionPct.toFixed(1)}%
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={demoModeLabel}
                    title={demoModeLabel}
                    onClick={onToggleDemoMode}
                    className={[
                      "inline-flex h-12 w-12 items-center justify-center rounded-lg border transition-colors",
                      demoMode
                        ? "border-[var(--rsm-blue)] bg-[rgb(var(--rsm-blue-rgb)/0.12)] text-[var(--rsm-blue)] hover:bg-[rgb(var(--rsm-blue-rgb)/0.18)] dark:border-[#79d7ff] dark:text-[#79d7ff]"
                        : "border-slate-300 bg-[var(--exec-card)] text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                    ].join(" ")}
                  >
                    <DemoModeIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Más acciones"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 bg-[var(--exec-card)] text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
              <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-[var(--exec-card)] text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                Selecciona un empleado para ver detalles
              </div>
            ) : (
              <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
                <section>
                  <KpiBar
                    variant="summary"
                    currentSalary={monetaryInfo?.salary}
                    currentBonus={monetaryInfo?.bonus}
                    raiseAmount={proposalKpis?.raiseAmount}
                    salaryVsAvgPct={proposalKpis?.salaryVsAvgPct}
                    bonusVsAvgPct={proposalKpis?.bonusVsAvgPct}
                    attritionRate={employee.attrition_rate}
                  />
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <SalaryProposalForm
                    demoMode={demoMode}
                    value={proposalDraft}
                    onChange={setProposalDraft}
                    onOpenSimulation={() => {
                      handleTabChange("decision-intelligence");
                      void runSimulation();
                    }}
                  />

                  <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-[var(--exec-card)] shadow-sm dark:border-slate-700/90 dark:bg-slate-800/60">
                    <div className="flex border-b border-slate-200 bg-slate-200/65 dark:border-slate-700/90 dark:bg-slate-900/35">
                      <button
                        type="button"
                        onClick={() => handleTabChange("decision-intelligence")}
                        className={[
                          "px-6 py-3 text-sm",
                          activeTab === "decision-intelligence"
                            ? "border-b-2 border-[var(--rsm-blue)] font-semibold text-slate-900 dark:border-[#79d7ff] dark:text-slate-100"
                            : "font-medium text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        Decision intelligence
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange("ona")}
                        className={[
                          "px-6 py-3 text-sm",
                          activeTab === "ona"
                            ? "border-b-2 border-[var(--rsm-blue)] font-semibold text-slate-900 dark:border-[#79d7ff] dark:text-slate-100"
                            : "font-medium text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        ONA
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange("desempeno")}
                        className={[
                          "px-6 py-3 text-sm",
                          activeTab === "desempeno"
                            ? "border-b-2 border-[var(--rsm-blue)] font-semibold text-slate-900 dark:border-[#79d7ff] dark:text-slate-100"
                            : "font-medium text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        Desempeño
                      </button>
                    </div>

                    <div className="overflow-hidden p-6">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, x: tabDirection > 0 ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: tabDirection > 0 ? -20 : 20 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="grid gap-5"
                        >
                      {activeTab === "decision-intelligence" && proposalDraft && (
                        <div className="grid gap-5">
                          <DecisionAttritionRiskPanel
                            currentProbability={employee.attrition_rate ?? null}
                            simulationResult={simulationResult}
                            simulationError={simulationError}
                          />

                          <DecisionInsightsCarousel insights={decisionInsights} />
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
                        <div className="space-y-5">
                          <EmployeeProgressChart employeeId={employee?.id} />
                          <EmployeeTimelineEvolution
                            demoMode={demoMode}
                            employeeId={employee?.id}
                          />
                        </div>
                      )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </section>

    </>
  );
}
