"use client";

import Image from "next/image";
import {
  Check,
  ChevronDown,
  Loader2,
  UserRoundSearch,
  X,
} from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { EmployeeCard, type EmployeeRow } from "./EmployeeCard";
import { ThemeToggle } from "./ThemeToggle";
import { fetchWithSessionRefresh } from "@/lib/api/http";

type Props = {
  office: string;
  department: string;
  society: string;
  limit?: number;
  offset?: number;
  collapsed?: boolean;
  demoMode?: boolean;
  savedProposalEmployeeIds?: ReadonlySet<number>;
  onEmployeesLoaded?: (employees: EmployeeRow[]) => void;
  onSelectEmployee?: (employee: EmployeeRow | null) => void;
  onToggleCollapse?: (collapsed: boolean) => void;
};

type CallStatus = "idle" | "loading" | "success" | "error";
type RiskFilter = "all" | "high";

type AppManagerOption = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  office_id?: number | null;
  office_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  category_id?: number | null;
  category_name?: string | null;
};

const SIDEBAR_CLASSES = {
  base: "relative flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-[var(--exec-sidebar)] dark:border-slate-700/80 dark:bg-[var(--exec-sidebar)]",
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
  demoMode = false,
  savedProposalEmployeeIds,
  onEmployeesLoaded,
}: Props) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [showEmployeePhotos, setShowEmployeePhotos] = useState(false);
  const [appManagersStatus, setAppManagersStatus] =
    useState<CallStatus>("idle");
  const [appManagers, setAppManagers] = useState<AppManagerOption[]>([]);
  const [appManagersError, setAppManagersError] = useState<string | null>(null);
  const [managerQuery, setManagerQuery] = useState("");
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const selectedManagerIdsKey = selectedManagerIds.join(",");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAppManagers() {
      setAppManagersStatus("loading");
      setAppManagersError(null);

      try {
        const params = new URLSearchParams({
          limit: "500",
          offset: "0",
        });

        const res = await fetchWithSessionRefresh(
          `/api/employees/people-culture/app-managers?${params.toString()}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (res.status === 403 || res.status === 404) {
          setAppManagers([]);
          setSelectedManagerIds([]);
          setAppManagersStatus("idle");
          return;
        }

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}\n${await res.text()}`);
        }

        const rows = (await res.json()) as AppManagerOption[];
        const normalizedRows = Array.isArray(rows) ? rows : [];

        startTransition(() => {
          setAppManagers(normalizedRows);
          setAppManagersStatus("success");
        });
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setAppManagersError(
            e instanceof Error ? e.message : "Unknown error",
          );
          setAppManagersStatus("error");
        }
      }
    }

    void loadAppManagers();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus("loading");
      setError(null);
      setShowEmployeePhotos(false);

      try {
        const activeManagerIds = selectedManagerIdsKey
          .split(",")
          .filter(Boolean)
          .map((id) => Number(id));
        const params = new URLSearchParams({
          office,
          department,
          society,
          limit: String(limit),
          offset: String(offset),
        });
        let endpoint = `/api/employees/manager/my-team?${params.toString()}`;

        if (activeManagerIds.length > 0) {
          activeManagerIds.forEach((managerId) => {
            params.append("manager_ids", String(managerId));
          });
          endpoint = `/api/employees/people-culture/impersonated-team?${params.toString()}`;
        }

        const res = await fetchWithSessionRefresh(endpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}\n${await res.text()}`);
        }

        const rows = (await res.json()) as EmployeeRow[];
        const normalizedRows = Array.isArray(rows) ? rows : [];
        onEmployeesLoaded?.(normalizedRows);

        if (normalizedRows.length > 0) {
          const selected =
            normalizedRows.find((r) => r.id === selectedId) || normalizedRows[0];
          setSelectedId(selected.id);
          onSelectEmployee?.(selected);
        } else {
          setSelectedId(null);
          onSelectEmployee?.(null);
        }

        startTransition(() => {
          setEmployees(normalizedRows);
          setStatus("success");
        });
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
  }, [office, department, society, limit, offset, selectedManagerIdsKey]);

  useEffect(() => {
    if (status !== "success" || employees.length === 0) return;

    let cancelled = false;

    const enablePhotos = () => {
      if (!cancelled) setShowEmployeePhotos(true);
    };

    // Dejamos que la vista principal dispare sus fetches primero.
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(enablePhotos, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(enablePhotos, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [employees.length, status]);

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const visibleEmployees = useMemo(() => {
    const filteredByQuery = isSearching
      ? employees.filter((employee) => {
          const fullName = `${employee.first_name} ${employee.last_name}`
            .trim()
            .toLowerCase();
          const email = employee.email.toLowerCase();

          return (
            fullName.includes(normalizedQuery) || email.includes(normalizedQuery)
          );
        })
      : employees;

    if (riskFilter === "high") {
      return filteredByQuery.filter(
        (employee) => employee.attrition_rate >= 0.3414,
      );
    }

    return filteredByQuery;
  }, [employees, isSearching, normalizedQuery, riskFilter]);

  const selectedManagers = useMemo(
    () =>
      selectedManagerIds
        .map((managerId) =>
          appManagers.find((manager) => manager.id === managerId),
        )
        .filter((manager): manager is AppManagerOption => Boolean(manager)),
    [appManagers, selectedManagerIds],
  );

  const toggleManagerSelection = (managerId: number) => {
    setSelectedManagerIds((current) =>
      current.includes(managerId)
        ? current.filter((id) => id !== managerId)
        : [...current, managerId],
    );
  };

  const clearManagerSelection = () => {
    setSelectedManagerIds([]);
  };

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
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        appManagersStatus={appManagersStatus}
        appManagers={appManagers}
        appManagersError={appManagersError}
        managerQuery={managerQuery}
        selectedManagerIds={selectedManagerIds}
        selectedManagers={selectedManagers}
        onManagerQueryChange={setManagerQuery}
        onToggleManager={toggleManagerSelection}
        onClearManagers={clearManagerSelection}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {status === "error" && !collapsed && (
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-[color:rgb(var(--rsm-red-rgb)/0.3)] bg-[rgb(var(--rsm-red-rgb)/0.08)] p-3 text-xs text-[var(--rsm-red)]">
            {error}
          </pre>
        )}

        {status === "success" && visibleEmployees.length === 0 && !collapsed && (
          <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            {isSearching
              ? `No hay resultados para "${query.trim()}".`
              : "No hay empleados para estos filtros."}
          </div>
        )}

        <div className={`flex flex-col gap-${collapsed ? "1" : "1.5"}`}>
          {visibleEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              demoMode={demoMode}
              showPhoto={showEmployeePhotos}
              selected={emp.id === selectedId}
              hasSavedProposal={savedProposalEmployeeIds?.has(emp.id) ?? false}
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
  riskFilter,
  onRiskFilterChange,
  appManagersStatus,
  appManagers,
  appManagersError,
  managerQuery,
  selectedManagerIds,
  selectedManagers,
  onManagerQueryChange,
  onToggleManager,
  onClearManagers,
}: {
  collapsed: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onToggleCollapse?: (c: boolean) => void;
  status: CallStatus;
  count: number;
  isSearching: boolean;
  riskFilter: RiskFilter;
  onRiskFilterChange: (filter: RiskFilter) => void;
  appManagersStatus: CallStatus;
  appManagers: AppManagerOption[];
  appManagersError: string | null;
  managerQuery: string;
  selectedManagerIds: number[];
  selectedManagers: AppManagerOption[];
  onManagerQueryChange: (q: string) => void;
  onToggleManager: (managerId: number) => void;
  onClearManagers: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-[var(--exec-sidebar)] dark:border-slate-700/80 dark:bg-[var(--exec-sidebar)]">
      <div className={`px-4 pt-5 ${collapsed ? "pb-2" : "pb-4"}`}>
        {!collapsed ? (
          <div className="mb-6 flex items-start justify-between">
            <div className="flex flex-col items-start gap-1.5">
              <CompanyMark className="h-10 w-auto" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                People Analytics
              </span>
            </div>
            <ThemeToggle />
          </div>
        ) : (
          <div className="mb-3 flex flex-col items-center gap-2">
            <CompanyMark className="h-8 w-auto" />
            <ThemeToggle />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="sr-only">
              Buscar empleado
            </div>
          )}
         
        </div>

        {!collapsed && appManagersStatus !== "idle" && (
          <AppManagerImpersonationPicker
            status={appManagersStatus}
            managers={appManagers}
            error={appManagersError}
            query={managerQuery}
            selectedManagerIds={selectedManagerIds}
            selectedManagers={selectedManagers}
            onQueryChange={onManagerQueryChange}
            onToggleManager={onToggleManager}
            onClearManagers={onClearManagers}
          />
        )}

        {!collapsed ? (
          <label className="relative mt-2 block">
            <span className="sr-only">Buscar</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar por email, nombre..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[var(--rsm-blue)] focus:ring-2 focus:ring-[rgb(var(--rsm-blue-rgb)/0.16)] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => onToggleCollapse?.(!collapsed)}
            className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
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
                ? "Cargando…"
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

function AppManagerImpersonationPicker({
  status,
  managers,
  error,
  query,
  selectedManagerIds,
  selectedManagers,
  onQueryChange,
  onToggleManager,
  onClearManagers,
}: {
  status: CallStatus;
  managers: AppManagerOption[];
  error: string | null;
  query: string;
  selectedManagerIds: number[];
  selectedManagers: AppManagerOption[];
  onQueryChange: (q: string) => void;
  onToggleManager: (managerId: number) => void;
  onClearManagers: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedIds = useMemo(
    () => new Set(selectedManagerIds),
    [selectedManagerIds],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredManagers = useMemo(() => {
    if (!normalizedQuery) return managers;

    return managers.filter((manager) => {
      const fullName = getAppManagerName(manager).toLowerCase();
      const email = manager.email.toLowerCase();
      const department = manager.department_name?.toLowerCase() ?? "";
      const category = manager.category_name?.toLowerCase() ?? "";

      return (
        fullName.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        department.includes(normalizedQuery) ||
        category.includes(normalizedQuery)
      );
    });
  }, [managers, normalizedQuery]);

  const selectedLabel =
    selectedManagers.length === 0
      ? "Mi equipo"
      : `${selectedManagers.length} app manager${
          selectedManagers.length === 1 ? "" : "s"
        }`;
  const buttonDisabled = status === "loading" || status === "error";

  return (
    <div className="mb-3 mt-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Impersonar
        </span>
        {selectedManagers.length > 0 && (
          <button
            type="button"
            onClick={onClearManagers}
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={buttonDisabled}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-[var(--rsm-blue)] focus:ring-2 focus:ring-[rgb(var(--rsm-blue-rgb)/0.16)] disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <UserRoundSearch className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {selectedManagers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedManagers.slice(0, 3).map((manager) => (
            <button
              key={manager.id}
              type="button"
              onClick={() => onToggleManager(manager.id)}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-[rgb(var(--rsm-blue-rgb)/0.25)] bg-[rgb(var(--rsm-blue-rgb)/0.08)] px-2 py-1 text-xs text-slate-700 hover:bg-[rgb(var(--rsm-blue-rgb)/0.14)] dark:text-slate-200"
              aria-label={`Quitar ${getAppManagerName(manager)}`}
            >
              <span className="truncate">{getAppManagerName(manager)}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          ))}
          {selectedManagers.length > 3 && (
            <span className="inline-flex h-7 items-center rounded-md bg-slate-100 px-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              +{selectedManagers.length - 3}
            </span>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="mt-2 rounded-lg border border-[color:rgb(var(--rsm-red-rgb)/0.3)] bg-[rgb(var(--rsm-red-rgb)/0.08)] px-3 py-2 text-xs text-[var(--rsm-red)]">
          {error ?? "No se pudieron cargar app managers."}
        </p>
      )}

      {open && status === "success" && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label className="relative block border-b border-slate-200 dark:border-slate-700">
            <span className="sr-only">Buscar app manager</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar app manager..."
              autoComplete="off"
              className="h-10 w-full bg-transparent py-2 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </label>

          <div className="max-h-52 overflow-y-auto p-1">
            {filteredManagers.length === 0 ? (
              <div className="px-2 py-3 text-sm text-slate-500">
                No hay resultados.
              </div>
            ) : (
              filteredManagers.map((manager) => {
                const selected = selectedIds.has(manager.id);
                const managerName = getAppManagerName(manager);
                const metaLabel = [
                  manager.category_name,
                  manager.department_name,
                  manager.office_name,
                ]
                  .filter(Boolean)
                  .join(" - ");

                return (
                  <button
                    key={manager.id}
                    type="button"
                    onClick={() => onToggleManager(manager.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "bg-[rgb(var(--rsm-blue-rgb)/0.1)] text-slate-900 dark:text-slate-50"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-[var(--rsm-blue)] bg-[var(--rsm-blue)] text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {managerName}
                      </span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {manager.email}
                      </span>
                      {metaLabel && (
                        <span className="block truncate text-[11px] text-slate-400">
                          {metaLabel}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getAppManagerName(manager: AppManagerOption) {
  return `${manager.first_name} ${manager.last_name}`.trim();
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
          ? "border-[var(--rsm-blue)] bg-[var(--rsm-blue)] text-white"
          : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
      <Image
        src="/logos/corporate/logo_light.svg.svg"
        alt="RSM logo"
        width={336}
        height={44}
        className="h-full w-full dark:hidden"
        priority
      />
      <Image
        src="/logos/corporate/logo_dark.svg.svg"
        alt="RSM logo"
        width={336}
        height={44}
        className="hidden h-full w-full dark:block"
        priority
      />
    </div>
  );
}
