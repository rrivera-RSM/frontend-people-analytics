"use client";

import type { EmployeeRow } from "@/components/EmployeeCard";
import EmployeeProgressChart from "@/components/EvaluationGraph";
import OnaRadarChart from "./ActiveOnaRadarChart";
import { SalaryProposalForm } from "./SalaryProposalForm";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiBar } from "./EmployeeKPIs";
import { computeProposalKpis } from "@/types/kpis";
import type {
  ProposalDraft,
  SalaryOffer,
  SalaryOfferPayload,
  SalaryProposalBenchmarkScope,
  SimulationResult,
} from "@/types/compensation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, EyeOff, Info, MoreVertical } from "lucide-react";
import { DecisionAttritionRiskPanel } from "@/components/DecisionAttritionRiskPanel";
import { DecisionInsightsCarousel } from "@/components/employee-insights/DecisionInsightsCarousel";
import { OnaOrganizationGraph } from "./OnaOrganizationGraph";
import { AnimatePresence, motion } from "framer-motion";
import { EmployeeTimelineEvolution } from "./EmployeeTimelineEvolution";

import type {
  EmployeeInsightCode,
} from "@/types/employee-insights";
import { mapInsightsToViewModels } from "@/lib/employee-insights";
import { useEmployeePanelData } from "@/hooks/use-employee-panel-data";
import { useSalaryProposalBenchmarks } from "@/hooks/use-salary-proposal-benchmarks";
import { useWarmChartLibraries } from "@/hooks/use-warm-chart-libraries";
import {
  buildSalaryProposalBenchmarkFilters,
  buildSalaryProposalBenchmarkScope,
  findSalaryProposalBenchmark,
  sanitizeSalaryProposalBenchmarkScope,
} from "@/lib/salary-proposal-benchmarks";
import {
  getDemoSensitiveImageClassName,
} from "@/lib/demo-mode";
import { fetchLatestSalaryOffer, saveSalaryOffer } from "@/lib/api/compensation";
import { fetchWithSessionRefresh } from "@/lib/api/http";
import { fetchOnaParticipationRate } from "@/lib/api/ona";

type Props = {
  employee: EmployeeRow | null;
  demoMode?: boolean;
  onToggleDemoMode?: () => void;
  savedProposalEmployeeIds?: ReadonlySet<number>;
  onProposalSavedChange?: (employeeId: number, isSaved: boolean) => void;
};

type EmployeeTab = "decision-intelligence" | "ona" | "desempeno";
const TAB_ORDER: EmployeeTab[] = ["decision-intelligence", "ona", "desempeno"];

const EMPTY_BENCHMARK_SCOPE: SalaryProposalBenchmarkScope = {
  society: false,
  department: false,
  office: false,
  category: false,
};

const SHORT_TENURE_METRICS_CUTOFF = new Date("2026-03-01T00:00:00.000Z");

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

function getAgeLabel(birthDate?: string | null) {
  const birth = parseDateSafe(birthDate);
  if (!birth) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? `${age} años` : null;
}

function normalizeComparableText(value?: string | null) {
  return value
    ?.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase() ?? "";
}

function isInternCategory(categoryName?: string | null) {
  return normalizeComparableText(categoryName).includes("becario");
}

function joinedAfterShortTenureCutoff(joinedAt?: string | null) {
  const joined = parseDateSafe(joinedAt);
  return joined != null && joined >= SHORT_TENURE_METRICS_CUTOFF;
}

function calculateIncreasePercentage(
  salaryCurrent: number,
  proposedSalary: number,
) {
  if (salaryCurrent <= 0) return 0;
  return ((proposedSalary - salaryCurrent) / salaryCurrent) * 100;
}

type AnalyticsUnavailableReason = {
  title: string;
  message: string;
};

function getAnalyticsUnavailableReason(
  employee?: EmployeeRow | null,
): AnalyticsUnavailableReason | null {
  if (!employee) return null;

  if (isInternCategory(employee.category_name)) {
    return {
      title: "Métricas no disponibles",
      message:
        "Los becarios no se registran para ONA, desempeño ni Decision Intelligence.",
    };
  }

  if (joinedAfterShortTenureCutoff(employee.joined_at)) {
    return {
      title: "Métricas no disponibles",
      message:
        "Este empleado lleva demasiado poco tiempo en la compañía para tener métricas disponibles.",
    };
  }

  return null;
}

function normalizeAttritionRate(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value <= 1 ? value * 100 : value;
}

function formatParticipationRate(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${(value * 100).toFixed(0)}%`;
}

function formatParticipationCount(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number.isInteger(value) ? String(value) : value.toFixed(0);
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

function buildInitialProposalDraft(
  employee: EmployeeRow,
  monetaryInfo: { salary: number; bonus: number },
): ProposalDraft {
  return {
    salaryCurrent: monetaryInfo.salary,
    currentBonus: monetaryInfo.bonus,
    currentCategoryId: employee.category_id,
    currentCategory: employee.category_name ?? "",
    proposedSalary: 0,
    bonus: monetaryInfo.bonus,
    nextFiscalYearBonus: 0,
    category: employee.category_name ?? "",
    includeBonus: monetaryInfo.bonus > 0,
    includeNextFiscalYearBonus: false,
    includeCategory: false,
  };
}

function mapSalaryOfferToDraft(
  baseDraft: ProposalDraft,
  offer: SalaryOffer,
): ProposalDraft {
  const proposedSalary = offer.new_salary;

  return {
    ...baseDraft,
    proposedSalary,
    bonus: offer.new_bonus ?? baseDraft.currentBonus ?? baseDraft.bonus,
    nextFiscalYearBonus: offer.bonus_next_fy ?? 0,
    category: offer.new_category ?? baseDraft.currentCategory ?? baseDraft.category,
    includeBonus: offer.new_bonus != null,
    includeNextFiscalYearBonus: offer.bonus_next_fy != null,
    includeCategory: Boolean(offer.new_category?.trim()),
    bonusPaymentMonth: offer.month_payment_bonus ?? "",
    observations: offer.observations ?? "",
    increasePercentage: calculateIncreasePercentage(
      baseDraft.salaryCurrent,
      proposedSalary,
    ),
  };
}

async function simulateSalaryProposalImpact(
  employeeId: number,
  draft: ProposalDraft,
): Promise<SimulationResult> {
  const payload = {
    employee_id: employeeId,
    new_salary: draft.proposedSalary,
    ...(draft.includeBonus ? { new_bonus: draft.bonus } : {}),
    ...(draft.includeCategory && draft.category
      ? { new_category: draft.category }
      : {}),
  };

  const res = await fetchWithSessionRefresh(
    "/api/predictive_attrition/simulate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

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

  const simulationItem = data.find((item) => item.id === employeeId) ?? data[0];
  if (typeof simulationItem.probability !== "number") {
    throw new Error("Respuesta de simulación inválida");
  }

  return {
    attritionProbability: simulationItem.probability,
    simulatedSalary: draft.proposedSalary,
    simulatedBonus: draft.includeBonus
      ? draft.bonus
      : draft.currentBonus ?? draft.bonus,
    simulatedAt: new Date().toISOString(),
  };
}

function AnalyticsUnavailableNotice({
  reason,
}: {
  reason: AnalyticsUnavailableReason;
}) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-[var(--exec-card)] px-6 py-10 text-center shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35">
      <div className="max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[color:rgb(var(--rsm-blue-rgb)/0.25)] bg-[rgb(var(--rsm-blue-rgb)/0.08)] text-[var(--rsm-blue)] dark:text-[#79d7ff]">
          <Info className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950 dark:text-slate-50">
          {reason.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {reason.message}
        </p>
      </div>
    </div>
  );
}

export function EmployeeView({
  employee,
  demoMode = false,
  onToggleDemoMode,
  savedProposalEmployeeIds,
  onProposalSavedChange,
}: Props) {
  const [proposalDraft, setProposalDraft] = useState<ProposalDraft | null>(null);
  const [benchmarkScope, setBenchmarkScope] =
    useState<SalaryProposalBenchmarkScope>(EMPTY_BENCHMARK_SCOPE);
  const [activeTab, setActiveTab] = useState<EmployeeTab>("decision-intelligence");
  const [tabDirection, setTabDirection] = useState(1);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [proposalSaveLoading, setProposalSaveLoading] = useState(false);
  const [proposalSaveError, setProposalSaveError] = useState<string | null>(null);
  const onProposalSavedChangeRef = useRef(onProposalSavedChange);
  const {
    monetaryInfo,
    onaData,
    onaDataLoading,
    insightsData,
    insightsLoading,
  } = useEmployeePanelData(employee?.id);
  const participationRateEnabled =
    employee?.society_id != null && employee?.office_id != null;
  const { data: onaParticipationRate } = useQuery({
    queryKey: [
      "ona",
      "participation-rate",
      employee?.society_id,
      employee?.office_id,
    ],
    queryFn: () => {
      if (employee?.society_id == null || employee.office_id == null) {
        return Promise.resolve(null);
      }

      return fetchOnaParticipationRate(
        employee.society_id,
        employee.office_id,
      );
    },
    enabled: participationRateEnabled,
    staleTime: 1000 * 60 * 5,
  });

  useWarmChartLibraries(Boolean(employee?.id));

  useEffect(() => {
    onProposalSavedChangeRef.current = onProposalSavedChange;
  }, [onProposalSavedChange]);

  const analyticsUnavailableReason = useMemo(
    () => getAnalyticsUnavailableReason(employee),
    [employee],
  );

  const handleTabChange = (nextTab: EmployeeTab) => {
    if (nextTab === activeTab) return;
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const nextIndex = TAB_ORDER.indexOf(nextTab);
    setTabDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (!employee?.id) {
      setProposalDraft(null);
      setSimulationError(null);
      setSimulationResult(null);
      setProposalSaveLoading(false);
      setProposalSaveError(null);
    }
  }, [employee?.id]);

  useEffect(() => {
    if (!employee || !monetaryInfo) {
      setProposalDraft(null);
      return;
    }

    let cancelled = false;
    const employeeId = employee.id;
    const employeeHasOffer = Boolean(employee.has_offer);
    const baseDraft = buildInitialProposalDraft(employee, monetaryInfo);

    setProposalDraft(baseDraft);
    setSimulationLoading(false);
    setSimulationError(null);
    setSimulationResult(null);
    setProposalSaveError(null);

    async function loadLatestSalaryOffer() {
      try {
        const latestOffer = await fetchLatestSalaryOffer(employeeId);

        if (cancelled) return;

        if (!latestOffer) {
          onProposalSavedChangeRef.current?.(employeeId, false);
          return;
        }

        const offerDraft = mapSalaryOfferToDraft(baseDraft, latestOffer);
        setProposalDraft(offerDraft);
        onProposalSavedChangeRef.current?.(employeeId, true);

        if (analyticsUnavailableReason) return;

        setSimulationLoading(true);
        setSimulationError(null);

        try {
          const result = await simulateSalaryProposalImpact(
            employeeId,
            offerDraft,
          );
          if (cancelled) return;
          setSimulationResult(result);
        } catch (err) {
          if (cancelled) return;
          setSimulationError(
            err instanceof Error
              ? err.message
              : "No se pudo ejecutar la simulación",
          );
          setSimulationResult(null);
        } finally {
          if (!cancelled) {
            setSimulationLoading(false);
          }
        }
      } catch (err) {
        if (cancelled) return;

        if (employeeHasOffer) {
          setProposalSaveError(
            err instanceof Error
              ? err.message
              : "No se pudo recuperar la propuesta guardada",
          );
        }
      }
    }

    void loadLatestSalaryOffer();

    return () => {
      cancelled = true;
    };
  }, [analyticsUnavailableReason, employee, monetaryInfo]);

  useEffect(() => {
    if (!proposalDraft) return;
    setSimulationError(null);
    setSimulationResult(null);
  }, [proposalDraft]);

  const benchmarkTarget = useMemo(() => {
    if (!employee) return null;

    return {
      societyId: employee.society_id,
      societyName: employee.society_name,
      departmentId: employee.department_id,
      departmentName: employee.department_name,
      officeId: employee.office_id,
      officeName: employee.office_name,
      categoryId: employee.category_id,
      categoryName: employee.category_name ?? null,
    };
  }, [employee]);

  const availableBenchmarkScope = useMemo(() => {
    return buildSalaryProposalBenchmarkScope(benchmarkTarget);
  }, [benchmarkTarget]);

  useEffect(() => {
    setBenchmarkScope((currentScope) => {
      return sanitizeSalaryProposalBenchmarkScope(
        currentScope,
        availableBenchmarkScope,
      );
    });
  }, [availableBenchmarkScope]);

  useEffect(() => {
    setBenchmarkScope(EMPTY_BENCHMARK_SCOPE);
  }, [employee?.id]);

  const selectedBenchmarkScope = useMemo(() => {
    return sanitizeSalaryProposalBenchmarkScope(
      benchmarkScope,
      availableBenchmarkScope,
    );
  }, [availableBenchmarkScope, benchmarkScope]);

  const benchmarkFilters = useMemo(() => {
    return buildSalaryProposalBenchmarkFilters(benchmarkTarget);
  }, [benchmarkTarget]);

  const {
    rows: employeeBenchmarkRows,
  } = useSalaryProposalBenchmarks(benchmarkFilters, Boolean(employee?.id));

  const selectedBenchmarkReference = useMemo(() => {
    return findSalaryProposalBenchmark(
      employeeBenchmarkRows,
      benchmarkTarget,
      selectedBenchmarkScope,
    );
  }, [employeeBenchmarkRows, benchmarkTarget, selectedBenchmarkScope]);

  const proposalKpis = useMemo(() => {
    if (!proposalDraft) return null;

    const effectiveBonus = proposalDraft.includeBonus
      ? proposalDraft.bonus
      : proposalDraft.currentBonus ?? proposalDraft.bonus;

    const kpis = computeProposalKpis(
      {
        salaryCurrent: proposalDraft.salaryCurrent,
        proposedPercentageIncrease: proposalDraft.increasePercentage,
        proposedSalary: proposalDraft.proposedSalary,
        bonus: effectiveBonus,
      },
      {
        avgSalaryIncrease: selectedBenchmarkReference?.salary_increase_avg,
        avgSalaryIncreasePercentage:
          selectedBenchmarkReference?.salary_increase_percentage_avg,
        avgBonus: selectedBenchmarkReference?.bonus_avg,
      },
    );

    return {
      ...kpis,
      salaryIncreaseVsAvgPct:
        proposalDraft.increasePercentage &&
        proposalDraft.increasePercentage > 0
          ? kpis.salaryIncreaseVsAvgPct
          : null,
    };
  }, [proposalDraft, selectedBenchmarkReference]);

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
  const ageLabel = useMemo(
    () => getAgeLabel(employee?.birth_date),
    [employee?.birth_date],
  );

  const attritionPct = normalizeAttritionRate(employee?.attrition_rate);
  const attritionIsHigh = attritionPct != null && attritionPct >= 34.14;
  const participationRateValue =
    typeof onaParticipationRate?.participation_rate === "number" &&
    Number.isFinite(onaParticipationRate.participation_rate)
      ? onaParticipationRate.participation_rate
      : null;
  const showParticipationWarning =
    participationRateValue != null && participationRateValue < 0.5;
  const participationRateLabel =
    formatParticipationRate(participationRateValue);
  const participationResponseLabel = formatParticipationCount(
    onaParticipationRate?.response_count,
  );
  const participationEmployeeLabel = formatParticipationCount(
    onaParticipationRate?.employee_count,
  );
  const onaParticipationWarning = showParticipationWarning
    ? {
        rateLabel: participationRateLabel,
        responseLabel: participationResponseLabel,
        employeeLabel: participationEmployeeLabel,
      }
    : null;
  const demoModeLabel = demoMode ? "Desactivar modo demo" : "Activar modo demo";
  const DemoModeIcon = demoMode ? EyeOff : Eye;
  const isProposalSaved =
    employee?.id != null && savedProposalEmployeeIds?.has(employee.id)
      ? true
      : false;

  const handleProposalDraftChange = (nextDraft: ProposalDraft) => {
    setProposalDraft(nextDraft);
    setProposalSaveError(null);
    setSimulationError(null);
    setSimulationResult(null);

    if (employee?.id != null && isProposalSaved) {
      onProposalSavedChange?.(employee.id, false);
    }
  };

  const handleProposalSave = async (nextDraft: ProposalDraft) => {
    if (!employee?.id || proposalSaveLoading) return;

    setProposalDraft(nextDraft);
    setProposalSaveLoading(true);
    setProposalSaveError(null);

    const payload: SalaryOfferPayload = {
      employee_id: employee.id,
      new_salary: nextDraft.proposedSalary,
      ...(nextDraft.includeBonus && nextDraft.bonus > 0
        ? {
            new_bonus: nextDraft.bonus,
            month_payment_bonus: nextDraft.bonusPaymentMonth?.trim() ?? "",
          }
        : {}),
      ...(nextDraft.includeNextFiscalYearBonus &&
      nextDraft.nextFiscalYearBonus &&
      nextDraft.nextFiscalYearBonus > 0
        ? { bonus_next_fy: nextDraft.nextFiscalYearBonus }
        : {}),
      ...(nextDraft.includeCategory && nextDraft.category.trim()
        ? { new_category: nextDraft.category.trim() }
        : {}),
      ...(nextDraft.observations?.trim()
        ? { observations: nextDraft.observations.trim() }
        : {}),
    };

    try {
      await saveSalaryOffer(payload);
      onProposalSavedChange?.(employee.id, true);
    } catch (err) {
      setProposalSaveError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la propuesta",
      );
      onProposalSavedChange?.(employee.id, false);
    } finally {
      setProposalSaveLoading(false);
    }
  };

  const runSimulation = async () => {
    if (
      !employee ||
      !proposalDraft ||
      simulationLoading ||
      analyticsUnavailableReason
    ) {
      return;
    }

    setSimulationLoading(true);
    setSimulationError(null);

    try {
      setSimulationResult(
        await simulateSalaryProposalImpact(employee.id, proposalDraft),
      );
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
                      {!demoMode && ageLabel && (
                        <span className="border-r border-slate-300 pr-3 last:border-r-0 dark:border-slate-700">
                          Edad: {ageLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  {!analyticsUnavailableReason && attritionPct != null && (
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
                {!analyticsUnavailableReason && (
                <section>
                  <KpiBar
                    currentSalary={monetaryInfo?.salary}
                    currentBonus={monetaryInfo?.bonus}
                    attritionRate={employee.attrition_rate}
                    salaryVsAvgPct={proposalKpis?.salaryIncreaseVsAvgPct}
                    bonusVsAvgPct={proposalKpis?.bonusVsAvgPct}
                    salaryIncreaseReference={
                      selectedBenchmarkReference?.salary_increase_avg
                    }
                    salaryIncreasePercentageReference={
                      selectedBenchmarkReference?.salary_increase_percentage_avg
                    }
                    bonusReference={selectedBenchmarkReference?.bonus_avg}
                    benchmarkScope={selectedBenchmarkScope}
                    availableBenchmarkScope={availableBenchmarkScope}
                    onBenchmarkScopeChange={setBenchmarkScope}
                  />
                </section>
                )}

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <SalaryProposalForm
                    demoMode={demoMode}
                    isSaved={isProposalSaved}
                    isSaving={proposalSaveLoading}
                    saveError={proposalSaveError}
                    value={proposalDraft}
                    onChange={handleProposalDraftChange}
                    onSave={handleProposalSave}
                    onOpenSimulation={() => {
                      handleTabChange("decision-intelligence");
                      void runSimulation();
                    }}
                    simulationDisabled={Boolean(analyticsUnavailableReason)}
                    simulationDisabledReason={analyticsUnavailableReason?.message}
                  />

                  {analyticsUnavailableReason ? (
                    <AnalyticsUnavailableNotice reason={analyticsUnavailableReason} />
                  ) : (
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
                      {activeTab === "decision-intelligence" && (
                        <div className="grid gap-5">
                          <DecisionAttritionRiskPanel
                            currentProbability={employee.attrition_rate ?? null}
                            simulationResult={simulationResult}
                            simulationError={simulationError}
                          />

                          {insightsLoading ? (
                            <div className="rounded-xl border border-slate-200 bg-[var(--exec-card)] p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35 dark:text-slate-400">
                              Cargando insights de decisión…
                            </div>
                          ) : (
                            <DecisionInsightsCarousel insights={decisionInsights} />
                          )}
                        </div>
                      )}

                      {activeTab === "ona" && (
                        <>
                          <OnaOrganizationGraph
                            employeeId={employee.id}
                            societyId={employee.society_id ?? null}
                            participationWarning={onaParticipationWarning}
                          />

                          <OnaRadarChart
                            data={onaData}
                            loading={onaDataLoading}
                            insights={onaInsights}
                            participationWarning={onaParticipationWarning}
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
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </section>

    </>
  );
}
