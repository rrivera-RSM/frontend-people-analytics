"use client";

import { useEffect, useMemo, useState } from "react";
import { EmployeeCard, type EmployeeRow } from "./EmployeeCard";
import { useDebounce } from "./hooks/useDebounce";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  office: string;
  department: string;
  society: string;
  limit?: number;
  offset?: number;
  collapsed?: boolean;
  onSelectEmployee?: (employee: EmployeeRow | null) => void;
  onToggleCollapse?: (collapsed: boolean) => void;
};

type CallStatus = "idle" | "loading" | "success" | "error";
type RiskFilter = "all" | "high";

const SIDEBAR_CLASSES = {
  base: "relative flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-[var(--exec-sidebar)] dark:border-slate-700/80 dark:bg-[#0b1322]",
  expanded: "w-[320px]",
  collapsed: "w-[76px]",
} as const;

export function EmployeesSidebar({
  office,
  department,
  society,
  limit = 100,
  offset = 0,
  onSelectEmployee,
  onToggleCollapse,
  collapsed = false,
}: Props) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const debouncedQuery = useDebounce(query, 300);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      office,
      department,
      society,
      limit: String(limit),
      offset: String(offset),
      ...(debouncedQuery.trim() && { q: debouncedQuery.trim() }),
    });
    return params.toString();
  }, [office, department, society, limit, offset, debouncedQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setError(null);

      try {
        const res = await fetch(`/api/employees/manager/my-team?${queryString}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}\n${await res.text()}`);
        }

        const rows = (await res.json()) as EmployeeRow[];
        setEmployees(Array.isArray(rows) ? rows : []);

        if (rows.length > 0) {
          const selected =
            rows.find((r) => r.id === selectedId) || rows[0];
          setSelectedId(selected.id);
          onSelectEmployee?.(selected);
        } else {
          setSelectedId(null);
          onSelectEmployee?.(null);
        }
        setStatus("success");
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setError(e instanceof Error ? e.message : "Unknown error");
          setStatus("error");
        }
      }
    }

    void load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const isSearching = debouncedQuery.trim().length > 0;

  const visibleEmployees = useMemo(() => {
    if (riskFilter === "high") {
      return employees.filter((employee) => employee.attrition_rate >= 0.3414);
    }

    return employees;
  }, [employees, riskFilter]);

  useEffect(() => {
    if (status !== "success") return;

    if (!visibleEmployees.length) {
      setSelectedId(null);
      onSelectEmployee?.(null);
      return;
    }

    const selected =
      visibleEmployees.find((employee) => employee.id === selectedId) ??
      visibleEmployees[0];

    if (selected.id !== selectedId) {
      setSelectedId(selected.id);
      onSelectEmployee?.(selected);
    }
  }, [onSelectEmployee, selectedId, status, visibleEmployees]);

  return (
    <aside
      id="employees-sidebar"
      className={`${SIDEBAR_CLASSES.base} ${
        collapsed ? SIDEBAR_CLASSES.collapsed : SIDEBAR_CLASSES.expanded
      } transition-[width] duration-200 ease-in-out`}
    >
      <Header
        collapsed={collapsed}
        query={query}
        onQueryChange={setQuery}
        onToggleCollapse={onToggleCollapse}
        status={status}
        count={visibleEmployees.length}
        isSearching={isSearching}
        office={office}
        department={department}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {status === "error" && !collapsed && (
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </pre>
        )}

        {status === "success" && visibleEmployees.length === 0 && !collapsed && (
          <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            {isSearching
              ? `No hay resultados para "${debouncedQuery}".`
              : "No hay empleados para estos filtros."}
          </div>
        )}

        <div className={`flex flex-col gap-${collapsed ? "1" : "1.5"}`}>
          {visibleEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              selected={emp.id === selectedId}
              onSelect={(e) => {
                setSelectedId(e.id);
                onSelectEmployee?.(e);
              }}
              compact={collapsed}
            />
          ))}
        </div>
      </div>

      <div className="border-t p-2" />
    </aside>
  );
}

function Header({
  collapsed,
  query,
  onQueryChange,
  onToggleCollapse,
  status,
  count,
  isSearching,
  office,
  department,
  riskFilter,
  onRiskFilterChange,
}: {
  collapsed: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onToggleCollapse?: (c: boolean) => void;
  status: CallStatus;
  count: number;
  isSearching: boolean;
  office: string;
  department: string;
  riskFilter: RiskFilter;
  onRiskFilterChange: (filter: RiskFilter) => void;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--exec-sidebar)] dark:border-slate-700/80 dark:bg-[#0b1322]">
      <div className={`px-4 pt-5 ${collapsed ? "pb-2" : "pb-4"}`}>
        {!collapsed ? (
          <div className="mb-6 flex items-start justify-between">
            <div className="flex flex-col items-start gap-1.5">
              <CompanyMark className="h-3.5 w-auto" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                People Analytics
              </span>
            </div>
            <ThemeToggle />
          </div>
        ) : (
          <div className="mb-3 flex flex-col items-center gap-2">
            <CompanyMark className="h-3.5 w-auto" />
            <ThemeToggle />
          </div>
        )}

        {!collapsed && (
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              Contexto
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-100">
              Estás viendo:
            </div>
            <div className="mt-1 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              {department} · {office}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="sr-only">
              Buscar empleado
            </div>
          )}
         
        </div>

        {!collapsed ? (
          <label className="relative mt-2 block">
            <span className="sr-only">Buscar</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar por email, nombre..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => onToggleCollapse?.(!collapsed)}
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Expandir para buscar"
            title="Expandir para buscar"
          >
            <SearchIcon />
          </button>
        )}

        {!collapsed && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
              Filtros
            </span>
            <Chip
              active={riskFilter === "all"}
              onClick={() => onRiskFilterChange("all")}
            >
              Todos
            </Chip>
            <Chip
              active={riskFilter === "high"}
              onClick={() => onRiskFilterChange("high")}
            >
              Alto riesgo
            </Chip>
          </div>
        )}

        {!collapsed && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {status === "loading"
                ? "Buscando…"
                : isSearching
                ? `Resultados: ${count}`
                : `Empleados: ${count}`}
            </span>
            {isSearching && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs font-medium border transition-colors ${
        active
          ? "border-blue-500 bg-blue-500 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function CompanyMark({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-label="Logotipo de la empresa" role="img">
      <svg
        viewBox="0 0 336 44"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="32" height="44" fill="#8f9398" />
        <rect x="44" y="0" width="78" height="44" fill="#45a339" />
        <rect x="136" y="0" width="200" height="44" fill="#1a96cf" />
        <text
          x="236"
          y="29"
          fill="#ffffff"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          letterSpacing="0.6"
        >
          RSM
        </text>
      </svg>
    </div>
  );
}
