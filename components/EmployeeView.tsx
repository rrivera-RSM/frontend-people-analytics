"use client";

import type { EmployeeRow } from "@/components/EmployeeCard";
import EmployeeProgressChart from "@/components/EvaluationGraph";
import OnaRadarChart from "./ActiveOnaRadarChart";
import { SalaryProposalForm } from "./SalaryProposalForm";
import { useEffect, useState, useMemo } from "react";
import { KpiBar } from "./EmployeeKPIs";
import { computeProposalKpis, type ProposalInputs } from "@/utils/kpis";
import { set } from "zod";

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

export function EmployeeView({ employee }: Props) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [monetaryInfo, setMonetaryInfo] = useState<MonetaryInfo | null>(null);
  const [onaData, setOnaData] = useState<OnaData | null>(null);
  const [proposalInputs, setProposalInputs] = useState<ProposalInputs | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee?.id) {
      setEvaluations([]);
      setMonetaryInfo(null);
      setOnaData(null);
      setProposalInputs(null);
      return;
    }
    let isMounted = true;
    setLoading(true);
    (async () => {
      const [evaluations, monetary, ona] = await Promise.all([
        fetchApi<Evaluation[]>(`/api/employees/${employee.id}/evaluations`),
        fetchApi<MonetaryInfo>(`/api/employees/${employee.id}/monetary-info`),
        fetchApi<OnaData>(`/api/ona/${employee.id}/active`),
      ]);

      if (!isMounted) return;
      setEvaluations(evaluations ?? []);
      setMonetaryInfo(monetary ?? null);
      setOnaData(ona ?? null);
      setLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [employee?.id]);

  const proposalKpis = useMemo(() => {
    if (!proposalInputs) return null;
    return computeProposalKpis(proposalInputs, AVG);
  }, [proposalInputs]);

  const fullName = employee
    ? `${employee.first_name} ${employee.last_name}`.trim()
    : "Selecciona un empleado";
  return (
    <section className="min-w-0 flex-1 min-h-0 h-full overflow-y-auto border [background-image:var(--exec-employee-view)]">
      <div className="h-full min-h-0 p-6 flex flex-col">
        {/* Header */}
        <header className="shrink-0">
          <div className="flex items-start justify-between gap-4">
            <h1 className="truncate text-base font-semibold">{fullName}</h1>
            
          </div>

          {employee && (
            <KpiBar
              raiseAmount={proposalKpis?.raiseAmount}
              salaryVsAvgPct={proposalKpis?.salaryVsAvgPct}
              bonusVsAvgPct={proposalKpis?.bonusVsAvgPct}
              performanceLabel="Excelente"
            />
          )}
        </header>

        {/* Body */}
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {!employee ? (
            <div className="h-full grid place-items-center text-sm">
              Selecciona un empleado para ver detalles
            </div>
          ) : (
            <div className="h-full min-h-0 flex flex-col gap-4">
              <SalaryProposalForm
                employee={employee}
                monetaryInfo={monetaryInfo}
                onValuesChange={setProposalInputs}
              />
              <div className="flex-1 min-h-0 h-full grid grid-cols-1 gap-7 lg:grid-cols-2">
                <EmployeeProgressChart data={evaluations} loading={loading} />
                <OnaRadarChart data={onaData} loading={loading} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
