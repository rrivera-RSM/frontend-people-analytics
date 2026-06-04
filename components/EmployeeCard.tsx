"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getDemoSensitiveImageClassName,
  getDemoSensitiveTextClassName,
} from "@/lib/demo-mode";

export type EmployeeRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  category_name: string;
  attrition_rate: number;
  dni?: string;
  office_id?: number;
  office_name?: string;
  department_id?: number;
  department_name?: string;
  society_id?: number;
  society_name?: string;
  joined_at?: string;
};

type Props = {
  employee: EmployeeRow;
  selected?: boolean;
  compact?: boolean;
  demoMode?: boolean;
  onSelect?: (employee: EmployeeRow) => void;
};

function getInitials(first: string, last: string) {
  const a = (first?.trim()?.[0] ?? "").toUpperCase();
  const b = (last?.trim()?.[0] ?? "").toUpperCase();
  return a + b || "—";
}

export function EmployeeCard({
  employee,
  selected = false,
  compact = false,
  demoMode = false,
  onSelect,
}: Props) {
  const [failedPhotoId, setFailedPhotoId] = useState<number | null>(null);

  const fullName = `${employee.first_name} ${employee.last_name}`.trim();
  const initials = useMemo(
    () => getInitials(employee.first_name, employee.last_name),
    [employee.first_name, employee.last_name],
  );

  const photoSrc = useMemo(
    () => `/api/employees/${employee.id}/photo`,
    [employee.id],
  );
  const photoOk = failedPhotoId !== employee.id;

  
  const isAttritionLow = employee.attrition_rate < 0.3414;
  const attritionRateClasses = [
    "inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[11px] font-medium ring-1",
    isAttritionLow
    ? "bg-[rgb(var(--rsm-green-rgb)/0.14)] text-[var(--rsm-green)] ring-[rgb(var(--rsm-green-rgb)/0.35)] dark:text-[#8ed989]"
    : "bg-[rgb(var(--rsm-red-rgb)/0.12)] text-[var(--rsm-red)] ring-[rgb(var(--rsm-red-rgb)/0.35)] dark:text-[#ff9ab8]",
  ].join(" ");
  
  const attritionRateLabel = isAttritionLow ? "Bajo riesgo" : "Alto riesgo";
  const extraInfoLabel = [employee.department_name, employee.office_name, employee.category_name]
    .filter(Boolean)
    .join(" · ");

  // --- COMPACT MODE: solo avatar, con tooltip ---
  if (compact) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onSelect?.(employee)}
              aria-label={fullName}
              aria-pressed={selected}
              className={[
                "w-full flex items-center justify-center",
                "rounded-xl p-2 transition-colors",

                selected
                  ? "border border-[var(--rsm-blue)] bg-[rgb(var(--rsm-blue-rgb)/0.09)] text-slate-900 shadow-[0_0_0_1px_rgba(0,156,222,0.25)] dark:bg-[rgb(var(--rsm-blue-rgb)/0.16)] dark:text-slate-50"
                  : "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70",

                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[var(--selected-ring)]",
                "focus-visible:ring-offset-2",
                "focus-visible:ring-offset-[var(--background)]",
              ].join(" ")}
            >
              <Avatar
                className={getDemoSensitiveImageClassName(
                  demoMode,
                  [
                  "h-10 w-10",
                  "border",
                  selected
                    ? "border-[var(--rsm-blue)] ring-2 ring-[rgb(var(--rsm-blue-rgb)/0.3)]"
                    : "border-slate-300 dark:border-slate-700",
                  ].join(" "),
                )}
              >
                {photoOk && (
                  <AvatarImage
                    src={photoSrc}
                    alt={`${fullName} avatar`}
                    loading="lazy"
                    onError={() => setFailedPhotoId(employee.id)}
                  />
                )}
                <AvatarFallback className="bg-slate-100 text-xs dark:bg-slate-700 dark:text-slate-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>

          <TooltipContent side="right" className="max-w-[240px]">
            <div
              className={getDemoSensitiveTextClassName(
                demoMode,
                "text-sm font-semibold",
              )}
            >
              {fullName}
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div
                className={getDemoSensitiveTextClassName(
                  demoMode,
                  "truncate text-xs text-slate-500",
                )}
              >
                {employee.email}
              </div>
              <div className={attritionRateClasses}>{attritionRateLabel}</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={getDemoSensitiveTextClassName(
                  demoMode,
                  "inline-flex max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700",
                )}
              >
                {employee.category_name}
              </span>
              {extraInfoLabel ? (
                <span
                  className={getDemoSensitiveTextClassName(
                    demoMode,
                    "truncate text-[11px] text-slate-500",
                  )}
                >
                  {extraInfoLabel}
                </span>
              ) : null}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // --- NORMAL MODE: avatar + texto ---
  return (
    <button
      type="button"
      onClick={() => onSelect?.(employee)}
      aria-pressed={selected}
      className={[
                "group relative w-full text-left",
                "flex items-center gap-3",
        "rounded-lg border px-3 py-3",
        "transition-colors",
        selected
          ? "border-[var(--rsm-blue)] bg-[rgb(var(--rsm-blue-rgb)/0.09)] text-slate-900 shadow-[0_0_0_1px_rgba(0,156,222,0.25)] dark:bg-[rgb(var(--rsm-blue-rgb)/0.16)] dark:text-slate-50"
          : "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70",

        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[var(--selected-ring)]",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[var(--background)]",

        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
        "focus-visible:ring-offset-sidebar",
      ].join(" ")}
    >
      {/* Barra izquierda de selección */}
      {selected && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[var(--rsm-blue)]" />
      )}

      <Avatar
        className={getDemoSensitiveImageClassName(
          demoMode,
          [
          "h-9 w-9 shrink-0",
          "border",
          selected ? "border-[var(--rsm-blue)]" : "border-slate-300 dark:border-slate-700",
          ].join(" "),
        )}
      >
        {photoOk && (
          <AvatarImage
            src={photoSrc}
            alt={`${fullName} avatar`}
            loading="lazy"
            onError={() => setFailedPhotoId(employee.id)}
          />
        )}
        <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-600 dark:text-slate-100">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div
          className={getDemoSensitiveTextClassName(
            demoMode,
            "truncate text-sm font-semibold text-slate-800 dark:text-slate-100",
          )}
        >
          {fullName}
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div
            className={getDemoSensitiveTextClassName(
              demoMode,
              "truncate text-xs text-slate-500 dark:text-slate-400",
            )}
          >
            {employee.email}
          </div>
          <div className={attritionRateClasses}>{attritionRateLabel}</div>
        </div>

        {extraInfoLabel ? (
          <div className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
            <span className={getDemoSensitiveTextClassName(demoMode)}>
              {extraInfoLabel}
            </span>
          </div>
        ) : null}

      </div>
    </button>
  );
}
