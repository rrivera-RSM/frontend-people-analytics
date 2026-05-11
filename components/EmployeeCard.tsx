"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  onSelect,
}: Props) {
  const [photoOk, setPhotoOk] = useState(true);

  const fullName = `${employee.first_name} ${employee.last_name}`.trim();
  const initials = useMemo(
    () => getInitials(employee.first_name, employee.last_name),
    [employee.first_name, employee.last_name],
  );

  const photoSrc = useMemo(
    () => `/api/employees/${employee.id}/photo`,
    [employee.id],
  );

  
  const isAttritionLow = employee.attrition_rate < 0.3414;
  const attritionRateClasses = [
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
    isAttritionLow
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700"
    : "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-700",
  ].join(" ");
  
  const attritionRateLabel = isAttritionLow ? "Bajo riesgo" : "Alto riesgo";
  const extraInfoLabel = [employee.department_name, employee.office_name, employee.category_name]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    setPhotoOk(true);
  }, [employee.id]);

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
                  ? "bg-[var(--selected-bg)] border-[var(--selected-border)] text-[var(--selected-fg)] shadow-[0_0_15px_rgba(0,92,148,0.12)]"
                  : "bg-transparent border-transparent hover:bg-[var(--item-hover)] dark:hover:bg-slate-800",

                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-[var(--selected-ring)]",
                "focus-visible:ring-offset-2",
                "focus-visible:ring-offset-[var(--background)]",
              ].join(" ")}
            >
              <Avatar
                className={[
                  "h-10 w-10",
                  "border",
                  selected
                    ? "border-[blue-200] ring-2 ring-blue-200"
                    : "",
                ].join(" ")}
              >
                {photoOk && (
                  <AvatarImage
                    src={photoSrc}
                    alt={`${fullName} avatar`}
                    loading="lazy"
                    onError={() => setPhotoOk(false)}
                  />
                )}
                <AvatarFallback className="bg-slate-100 text-xs dark:bg-slate-700 dark:text-slate-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>

          <TooltipContent side="right" className="max-w-[240px]">
            <div className="text-sm font-semibold">{fullName}</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="truncate text-xs text-slate-500">{employee.email}</div>
              <div className={attritionRateClasses}>{attritionRateLabel}</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700">
                {employee.category_name}
              </span>
              {extraInfoLabel ? (
                <span className="truncate text-[11px] text-slate-500">{extraInfoLabel}</span>
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
        "rounded-xl px-3 py-2.5",
        "transition-colors",
        selected
          ? "bg-[var(--selected-bg)] border-[var(--selected-border)] text-[var(--selected-fg)]"
          : " border-transparent hover:bg-[var(--item-hover)] dark:hover:bg-slate-800",

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
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-600" />
      )}

      <Avatar
        className={[
          "h-9 w-9 shrink-0",
          "border",
          selected ? "border-blue-200" : "border-slate-200 dark:border-slate-700",
        ].join(" ")}
      >
        {photoOk && (
          <AvatarImage
            src={photoSrc}
            alt={`${fullName} avatar`}
            loading="lazy"
            onError={() => setPhotoOk(false)}
          />
        )}
        <AvatarFallback className="bg-slate-100 text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{fullName}</div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="truncate text-xs text-slate-500">{employee.email}</div>
          <div className={attritionRateClasses}>{attritionRateLabel}</div>
        </div>

        {extraInfoLabel ? (
          <div className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
            {extraInfoLabel}
          </div>
        ) : null}

      </div>
    </button>
  );
}
