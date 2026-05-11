"use client";

import { useEffect, useMemo, useState } from "react";
import { EmployeeCard, type EmployeeRow } from "./EmployeeCard";
import { useDebounce } from "./hooks/useDebounce";

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

const SIDEBAR_CLASSES = {
  base: "relative flex h-full shrink-0 flex-col overflow-hidden border",
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
        const res = await fetch(`/api/employees/manager/my-team`, {
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
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError(e?.message ?? "Unknown error");
          setStatus("error");
        }
      }
    }

    void load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const isSearching = debouncedQuery.trim().length > 0;

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
        count={employees.length}
        isSearching={isSearching}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {status === "error" && !collapsed && (
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </pre>
        )}

        {status === "success" && employees.length === 0 && !collapsed && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {isSearching
              ? `No hay resultados para "${debouncedQuery}".`
              : "No hay empleados para estos filtros."}
          </div>
        )}

        <div className={`flex flex-col gap-${collapsed ? "1" : "1.5"} bg-[var(--exec-)]`}>
          {employees.map((emp) => (
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
}: {
  collapsed: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onToggleCollapse?: (c: boolean) => void;
  status: CallStatus;
  count: number;
  isSearching: boolean;
}) {
  return (
    <div className="sticky top-0 z-10 border-b bg-[var(--exec-)]">
      <div className={`p-3 ${collapsed ? "pb-2" : "pb-3"}`}>
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="text-xs font-semibold tracking-wide">
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
              placeholder="Buscar por email, nombre o DNI…"
              className="w-full rounded-xl border bg-[var(--exec-input)] py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/20"
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => onToggleCollapse?.(!collapsed)}
            className="mt-2 w-full inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-[var(--exec-input)] hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            aria-label="Expandir para buscar"
            title="Expandir para buscar"
          >
            <SearchIcon />
          </button>
        )}

        {!collapsed && (
          <div className="mt-2 flex items-center justify-between text-xs">
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

        {!collapsed && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pb-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Filtros
            </span>
            <Chip active>Todos</Chip>
            <Chip>Alto riesgo</Chip>
            <Chip>Junior</Chip>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`rounded-full px-3 py-1 text-xs font-medium border ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
