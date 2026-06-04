"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Euro,
  LineChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type {
  EmployeeTimelineEvolutionResponse,
  EmployeeTimelineEvent,
  OrgChangePayload,
  SalaryChangePayload,
  EvaluationPayload,
} from "@/types/timeline-evolution";

type Props = {
  employeeId: number | null | undefined;
  demoMode?: boolean;
};

type TimelineViewMode = "snake" | "by_type";

type TimelineGroup = {
  key: string;
  dateLabel: string;
  eventAt: string;
  eventTimestamp: number | null;
  summaries: TimelineSummary[];
  eventTypes: string[];
  primaryType: string;
};

type TimelineTrend = {
  delta: number;
  direction: "up" | "down" | "flat";
  label?: string;
};

type EvaluationLevel = {
  label: "Alto" | "Medio" | "Bajo";
  toneClassName: string;
};

type TimelineSummary = {
  text: string;
  trend?: TimelineTrend;
  level?: EvaluationLevel;
  sensitive?: boolean;
  redactedText?: string;
};

type SalarySnapshot = {
  salary: number | null;
  bonus: number | null;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseDateSafe(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatMoneyDelta(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

function getSalarySnapshot(payload: SalaryChangePayload): SalarySnapshot {
  return {
    salary: isFiniteNumber(payload.salary) ? payload.salary : null,
    bonus: isFiniteNumber(payload.bonus) ? payload.bonus : null,
  };
}

function getSalaryTrend(
  current: SalarySnapshot,
  previous: SalarySnapshot | null,
): TimelineTrend | undefined {
  if (!previous || current.salary == null || previous.salary == null) {
    return undefined;
  }

  const salaryDelta = current.salary - previous.salary;
  const bonusDelta =
    current.bonus != null && previous.bonus != null
      ? current.bonus - previous.bonus
      : null;

  const parts: string[] = [];
  if (salaryDelta !== 0) {
    parts.push(`${formatMoneyDelta(salaryDelta)} salario`);
  }
  if (bonusDelta != null && bonusDelta !== 0) {
    parts.push(`${formatMoneyDelta(bonusDelta)} bonus`);
  }

  const referenceDelta = salaryDelta !== 0 ? salaryDelta : bonusDelta ?? 0;
  const direction =
    referenceDelta > 0 ? "up" : referenceDelta < 0 ? "down" : "flat";

  return {
    delta: referenceDelta,
    direction,
    label: parts.length > 0 ? parts.join(" · ") : "Sin cambios",
  };
}

function getEvaluationScore(payload: EvaluationPayload) {
  return typeof payload.final_score === "number" &&
    Number.isFinite(payload.final_score) &&
    payload.final_score > 0
    ? payload.final_score
    : null;
}

function getEvaluationLevel(score: number): EvaluationLevel {
  if (score >= 90) {
    return {
      label: "Alto",
      toneClassName: "text-[var(--rsm-green)] dark:text-[#8ed989]",
    };
  }

  if (score >= 75) {
    return {
      label: "Medio",
      toneClassName: "text-[#9f6f00] dark:text-[#ffe29c]",
    };
  }

  return {
    label: "Bajo",
    toneClassName: "text-[var(--rsm-red)] dark:text-[#ff9ab8]",
  };
}

function getEventSummary(
  event: EmployeeTimelineEvent,
  occurrenceIndex = 0,
  previousEvaluationScore: number | null = null,
  previousSalarySnapshot: SalarySnapshot | null = null,
): TimelineSummary {
  switch (event.event_type) {
    case "org_change": {
      const payload = event.payload as unknown as OrgChangePayload;
      const category = payload.category_name?.trim();
      const department = payload.department_name?.trim();
      const office = payload.office_name?.trim();

      if (occurrenceIndex === 0) {
        if (category) {
          return {
            text: `Categoría inicial: ${category}`,
            sensitive: true,
            redactedText: "Categoría inicial censurada",
          };
        }
        if (department) {
          return {
            text: `Departamento inicial: ${department}`,
            sensitive: true,
            redactedText: "Departamento inicial censurado",
          };
        }
        if (office) {
          return {
            text: `Oficina inicial: ${office}`,
            sensitive: true,
            redactedText: "Oficina inicial censurada",
          };
        }
      }

      if (category) {
        return {
          text: `Ascendido a ${category}`,
          sensitive: true,
          redactedText: "Cambio de categoría censurado",
        };
      }
      if (department) {
        return {
          text: `Cambio a ${department}`,
          sensitive: true,
          redactedText: "Cambio de departamento censurado",
        };
      }
      if (office) {
        return {
          text: `Traslado a ${office}`,
          sensitive: true,
          redactedText: "Traslado de oficina censurado",
        };
      }
      return { text: "Cambio organizativo" };
    }
    case "salary_change": {
      const payload = event.payload as unknown as SalaryChangePayload;
      const salary = formatMoney(payload.salary);
      const bonus = payload.bonus ? ` · Bonus ${formatMoney(payload.bonus)}` : "";
      const trend = getSalaryTrend(
        getSalarySnapshot(payload),
        previousSalarySnapshot,
      );
      return {
        text:
          occurrenceIndex === 0
            ? `Salario inicial: ${salary}${bonus}`
            : `Salario actualizado a ${salary}${bonus}`,
        trend: occurrenceIndex === 0 ? undefined : trend,
      };
    }
    case "evaluation": {
      const payload = event.payload as unknown as EvaluationPayload;
      const score = getEvaluationScore(payload);

      if (score == null) {
        return { text: "Evaluación sin resultado registrado" };
      }

      const currentLevel = getEvaluationLevel(score);
      const trend =
        previousEvaluationScore != null
          ? {
              delta: Number((score - previousEvaluationScore).toFixed(2)),
              direction:
                getEvaluationLevel(previousEvaluationScore).label === currentLevel.label
                  ? "flat"
                  : score > previousEvaluationScore
                    ? "up"
                    : "down",
            }
          : undefined;

      return {
        text: `Evaluación con score ${score.toFixed(2)}`,
        level: currentLevel,
        trend,
      };
    }
    default:
      return { text: event.title || "Actualización" };
  }
}

function getEventMeta(eventType: string) {
  if (eventType === "org_change") {
    return {
      Icon: Briefcase,
      dotClassName: "bg-[#009CDE] text-white ring-[#009CDE]/18 dark:ring-[#009CDE]/35",
      labelClassName: "text-[#007db2] dark:text-[#79d7ff]",
    };
  }
  if (eventType === "salary_change") {
    return {
      Icon: Euro,
      dotClassName: "bg-[#3F9C35] text-white ring-[#3F9C35]/18 dark:ring-[#3F9C35]/35",
      labelClassName: "text-[#2f7c28] dark:text-[#8ed989]",
    };
  }
  if (eventType === "evaluation") {
    return {
      Icon: LineChart,
      dotClassName: "bg-[#F1B434] text-[#00153D] ring-[#F1B434]/22 dark:ring-[#F1B434]/35",
      labelClassName: "text-[#9f6f00] dark:text-[#ffe29c]",
    };
  }
  return {
    Icon: Sparkles,
    dotClassName: "bg-[#888B8D] text-white ring-[#888B8D]/18 dark:ring-[#888B8D]/30",
    labelClassName: "text-[#63666A] dark:text-[#d9dcde]",
  };
}

function getDateKey(iso: string | null | undefined) {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function sortEventsAscending(events: EmployeeTimelineEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.event_at).getTime() - new Date(b.event_at).getTime(),
  );
}

function groupEventsByDate(events: EmployeeTimelineEvent[]) {
  const groups = new Map<string, TimelineGroup>();
  const typeCounts = new Map<string, number>();
  let lastEvaluationScore: number | null = null;
  let lastSalarySnapshot: SalarySnapshot | null = null;

  sortEventsAscending(events).forEach((event) => {
    const key = getDateKey(event.event_at);
    const existing = groups.get(key);
    const occurrenceIndex = typeCounts.get(event.event_type) ?? 0;
    const evaluationPayload = event.payload as unknown as EvaluationPayload;
    const summary = getEventSummary(
      event,
      occurrenceIndex,
      lastEvaluationScore,
      lastSalarySnapshot,
    );

    typeCounts.set(event.event_type, occurrenceIndex + 1);

    if (event.event_type === "evaluation") {
      const score = getEvaluationScore(evaluationPayload);
      if (score != null) {
        lastEvaluationScore = score;
      }
    }

    if (event.event_type === "salary_change") {
      lastSalarySnapshot = getSalarySnapshot(
        event.payload as unknown as SalaryChangePayload,
      );
    }

    if (existing) {
      existing.summaries.push(summary);
      existing.eventTypes.push(event.event_type);
      return;
    }

    groups.set(key, {
      key,
      dateLabel: formatDate(event.event_at),
      eventAt: event.event_at,
      eventTimestamp: parseDateSafe(event.event_at)?.getTime() ?? null,
      summaries: [summary],
      eventTypes: [event.event_type],
      primaryType: event.event_type,
    });
  });

  return Array.from(groups.values());
}

function getEventTypeLabel(eventType: string) {
  switch (eventType) {
    case "org_change":
      return "Cambios organizativos";
    case "salary_change":
      return "Salarios";
    case "evaluation":
      return "Evaluaciones";
    default:
      return "Otros eventos";
  }
}

function buildLanes(events: EmployeeTimelineEvent[]) {
  const lanes = new Map<string, EmployeeTimelineEvent[]>();

  sortEventsAscending(events).forEach((event) => {
    const existing = lanes.get(event.event_type);
    if (existing) {
      existing.push(event);
      return;
    }

    lanes.set(event.event_type, [event]);
  });

  return Array.from(lanes.entries()).map(([eventType, laneEvents]) => ({
    eventType,
    label: getEventTypeLabel(eventType),
    count: laneEvents.length,
    groups: groupEventsByDate(laneEvents),
  }));
}

export function EmployeeTimelineEvolution({
  employeeId,
  demoMode = false,
}: Props) {
  const [data, setData] = useState<EmployeeTimelineEvolutionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<TimelineViewMode>("snake");

  useEffect(() => {
    if (!employeeId) {
      setData(null);
      setError(null);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/employees/${employeeId}/timeline-evolution`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`No se pudo cargar timeline (${res.status})`);
        }

        const json = (await res.json()) as EmployeeTimelineEvolutionResponse;
        if (!mounted) return;
        setData(json);
      } catch (err) {
        if (!mounted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Error inesperado");
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [employeeId]);

  const events = useMemo(() => data?.events ?? [], [data]);
  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);
  const lanes = useMemo(() => buildLanes(events), [events]);
  const hasMultipleTypes = lanes.length > 1;

  return (
    <Card className="bg-[var(--exec-card)] dark:bg-slate-900/40">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Evolución del empleado</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Vista cronológica con eventos conectados y, si quieres, separados por tipo.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-100/85 px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Agrupar por tipo
            </span>
            <Switch
              size="sm"
              checked={viewMode === "by_type"}
              onCheckedChange={(checked) =>
                setViewMode(checked ? "by_type" : "snake")
              }
              disabled={!hasMultipleTypes}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-sm text-slate-500 dark:text-slate-400">Cargando timeline...</div>
        )}

        {!loading && error && (
          <div className="rounded-md border border-[color:rgb(var(--rsm-red-rgb)/0.35)] bg-[rgb(var(--rsm-red-rgb)/0.08)] p-3 text-sm text-[var(--rsm-red)] dark:text-[#ff9ab8]">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400">No hay eventos para este empleado.</div>
        )}

        {!loading && !error && groupedEvents.length > 0 && viewMode === "snake" && (
          <TimelineSnake demoMode={demoMode} groups={groupedEvents} />
        )}

        {!loading && !error && groupedEvents.length > 0 && viewMode === "by_type" && (
          <div className="space-y-4">
            {lanes.map((lane) => {
              const meta = getEventMeta(lane.eventType);

              return (
                <section
                  key={lane.eventType}
                  className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className={`text-sm font-semibold ${meta.labelClassName}`}>
                        {lane.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {lane.count} evento{lane.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className={`h-2.5 w-2.5 rounded-full ${meta.dotClassName.split(" ")[0]}`} />
                  </div>
                  <TimelineSnake
                    compact
                    demoMode={demoMode}
                    groups={lane.groups}
                  />
                </section>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineSnake({
  groups,
  compact = false,
  demoMode = false,
}: {
  groups: TimelineGroup[];
  compact?: boolean;
  demoMode?: boolean;
}) {
  if (!groups.length) return null;

  return (
    <div className={`relative ${compact ? "pt-1" : "py-1"}`}>
      <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-4">
        {groups.map((group, index) => {
          const isLeft = index % 2 === 0;
          const isMixed = new Set(group.eventTypes).size > 1;
          const meta = getEventMeta(isMixed ? "mixed" : group.primaryType);
          const visibleSummaries = group.summaries.map((item) =>
            demoMode && item.sensitive ? item.redactedText ?? item.text : item.text,
          );
          const summaryText =
            visibleSummaries.length <= 2
              ? visibleSummaries.join(" · ")
              : `${visibleSummaries
                  .slice(0, 2)
                  .join(" · ")} +${group.summaries.length - 2} más`;
          const primaryTrend =
            group.summaries.length === 1 ? group.summaries[0]?.trend : undefined;
          const primaryLevel =
            group.summaries.length === 1 ? group.summaries[0]?.level : undefined;

          return (
            <div
              key={group.key}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3"
            >
              <div className={isLeft ? "flex justify-end" : "pointer-events-none opacity-0"}>
                {isLeft ? (
                  <TimelineCard
                    meta={meta}
                    dateLabel={group.dateLabel}
                    summary={summaryText}
                    trend={primaryTrend}
                    level={primaryLevel}
                    compact={compact}
                    side="left"
                    eventCount={group.summaries.length}
                  />
                ) : null}
              </div>

              <div className="relative flex items-center justify-center">
                <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-slate-300 dark:bg-slate-600" />
                <div
                  className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-[var(--exec-bg)] ${meta.dotClassName}`}
                >
                  <meta.Icon className="h-4 w-4" />
                </div>
              </div>

              <div className={isLeft ? "pointer-events-none opacity-0" : "flex justify-start"}>
                {!isLeft ? (
                  <TimelineCard
                    meta={meta}
                    dateLabel={group.dateLabel}
                    summary={summaryText}
                    trend={primaryTrend}
                    level={primaryLevel}
                    compact={compact}
                    side="right"
                    eventCount={group.summaries.length}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCard({
  meta,
  dateLabel,
  summary,
  trend,
  level,
  compact,
  side,
  eventCount,
}: {
  meta: ReturnType<typeof getEventMeta>;
  dateLabel: string;
  summary: string;
  trend?: TimelineTrend;
  level?: EvaluationLevel;
  compact: boolean;
  side: "left" | "right";
  eventCount: number;
}) {
  return (
    <div
      className={[
        "w-full max-w-[27rem] px-1 py-1",
        side === "left" ? "mr-3" : "ml-3",
        compact ? "max-w-[22rem]" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className={`text-xs font-semibold ${meta.labelClassName}`}>{dateLabel}</div>
          {eventCount > 1 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {eventCount} hitos
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-slate-700 dark:text-slate-200">
          <span>{summary}</span>
          {level && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className={`font-medium ${level.toneClassName}`}>{level.label}</span>
            </>
          )}
          {trend && (
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                trend.direction === "up"
                  ? "bg-[rgb(var(--rsm-green-rgb)/0.14)] text-[var(--rsm-green)] dark:bg-[rgb(var(--rsm-green-rgb)/0.22)] dark:text-[#8ed989]"
                  : trend.direction === "down"
                    ? "bg-[rgb(var(--rsm-red-rgb)/0.12)] text-[var(--rsm-red)] dark:bg-[rgb(var(--rsm-red-rgb)/0.22)] dark:text-[#ff9ab8]"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              ].join(" ")}
              aria-label={
                trend.direction === "up"
                  ? "Tendencia al alza"
                  : trend.direction === "down"
                    ? "Tendencia a la baja"
                    : "Tendencia estable"
              }
            >
              {trend.direction === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : trend.direction === "down" ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
              <span>
                {trend.label ??
                  `${trend.direction === "up" && trend.delta > 0 ? "+" : ""}${trend.delta.toFixed(2)}`}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
