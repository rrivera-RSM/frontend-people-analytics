"use client";

import type { EmployeeRow } from "@/components/EmployeeCard";
import EmployeeProgressChart from "@/components/EvaluationGraph";
import OnaRadarChart from "./ActiveOnaRadarChart";
import { SalaryProposalForm } from "./SalaryProposalForm";
import { CompensationSimulationModal } from "./CompensationSimulationModal";
import { useEffect, useState, useMemo } from "react";
import { KpiBar } from "./EmployeeKPIs";
import { computeProposalKpis } from "@/types/kpis";
import type { ProposalDraft, SimulationResult } from "@/types/compensation";

import type {
  EmployeeInsightsResponseApi,
  EmployeeInsightCode,
} from "@/types/employee-insights";
import { mapInsightsToViewModels } from "@/lib/employee-insights";

type Props = {
  employee: EmployeeRow | null;
};

export type Evaluation = {
  evaluation_at: string;
  final_score: number;
  impact_evaluation_at: string;
  bol_positive_impact: number;
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

export function EmployeeView({ employee }: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [monetaryInfo, setMonetaryInfo] = useState<MonetaryInfo | null>(null);
  const [onaData, setOnaData] = useState<OnaData | null>(null);
  const [insightsData, setInsightsData] =
    useState<EmployeeInsightsResponseApi | null>(null);

  const [proposalDraft, setProposalDraft] = useState<ProposalDraft | null>(null);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [acceptedSimulation, setAcceptedSimulation] =
    useState<SimulationResult | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee?.id) {
      setEvaluations([]);
      setMonetaryInfo(null);
      setOnaData(null);
      setInsightsData(null);
      setProposalDraft(null);
      setAcceptedSimulation(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    // limpiamos para evitar mostrar datos stale al cambiar de empleado
    setEvaluations([]);
    setMonetaryInfo(null);
    setOnaData(null);
    setInsightsData(null);
    setProposalDraft(null);
    setAcceptedSimulation(null);

    (async () => {
      const [evaluations, monetary, ona, insights] = await Promise.all([
        fetchApi<Evaluation[]>(`/api/employees/${employee.id}/evaluations`),
        fetchApi<MonetaryInfo>(`/api/employees/${employee.id}/monetary-info`),
        fetchApi<OnaData>(`/api/ona/${employee.id}/active`),
        fetchApi<EmployeeInsightsResponseApi>(
          `/api/employees/${employee.id}/insights`,
        ),
      ]);

      if (!isMounted) return;

      setEvaluations(evaluations ?? []);
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
      comments: "",
    });
  }, [employee, monetaryInfo]);

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

  const modalInsights = useMemo(() => {
    return insightViewModels.filter(
      (insight) =>
        !PERFORMANCE_CHART_CODES.has(insight.code) &&
        !ONA_CHART_CODES.has(insight.code),
    );
  }, [insightViewModels]);

  const fullName = employee
    ? `${employee.first_name} ${employee.last_name}`.trim()
    : "Selecciona un empleado";

  return (
    <>
      <section className="min-w-0 flex-1 min-h-0 h-full overflow-y-auto border [background-image:var(--exec-employee-view)]">
        <div className="h-full min-h-0 p-4 flex flex-col">
          {/* Header */}
          <header className="shrink-0">
            <div className="flex items-start justify-between gap-4">
              <h1 className="truncate text-base font-semibold">{fullName}</h1>
            </div>

            {employee && (
              <>
                <KpiBar
                  raiseAmount={proposalKpis?.raiseAmount}
                  salaryVsAvgPct={proposalKpis?.salaryVsAvgPct}
                  bonusVsAvgPct={proposalKpis?.bonusVsAvgPct}
                  attritionRate={employee.attrition_rate}
                />

                {acceptedSimulation && (
                  <div className="mt-2 text-xs text-slate-300">
                    Última simulación confirmada: attrition estimado{" "}
                    <span className="font-semibold text-white">
                      {(acceptedSimulation.attritionProbability * 100).toFixed(1)}%
                    </span>{" "}
                    con salario{" "}
                    <span className="font-semibold text-white">
                      {new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 2,
                      }).format(acceptedSimulation.simulatedSalary)}
                    </span>
                  </div>
                )}
              </>
            )}
          </header>

          {/* Body */}
          <div className="mt-2 flex-1 min-h-0 overflow-x-hidden">
            {!employee ? (
              <div className="h-full grid place-items-center text-sm">
                Selecciona un empleado para ver detalles
              </div>
            ) : (
              <div className="h-full min-h-0 flex flex-col gap-2">
                <SalaryProposalForm
                  employee={employee}
                  monetaryInfo={monetaryInfo}
                  value={proposalDraft}
                  onChange={setProposalDraft}
                  hasInsights={modalInsights.length > 0}
                  onOpenSimulation={() => setSimulationOpen(true)}
                />

                <div className="flex-1 min-h-0 h-full grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <EmployeeProgressChart
                    employeeId={employee?.id}
                    insights={performanceInsights}
                  />

                  <OnaRadarChart
                    data={onaData}
                    loading={loading}
                    insights={onaInsights}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {employee && proposalDraft && (
        <CompensationSimulationModal
          open={simulationOpen}
          onOpenChange={setSimulationOpen}
          employee={employee}
          draft={proposalDraft}
          insights={modalInsights}
          onConfirm={({ proposedSalary, bonus, simulationResult }) => {
            setProposalDraft((prev) =>
              prev
                ? {
                    ...prev,
                    proposedSalary,
                    bonus,
                  }
                : prev,
            );

            setAcceptedSimulation(simulationResult);
            setSimulationOpen(false);
          }}
        />
      )}
    </>
  );
}