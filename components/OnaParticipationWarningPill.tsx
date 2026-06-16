"use client";

import { AlertTriangle } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export type OnaParticipationWarningDetails = {
  rateLabel: string | null;
  responseLabel: string | null;
  employeeLabel: string | null;
};

type Props = OnaParticipationWarningDetails & {
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

export function OnaParticipationWarningPill({
  rateLabel,
  responseLabel,
  employeeLabel,
  className = "",
  side = "top",
  align = "start",
}: Props) {
  const countLabel =
    responseLabel && employeeLabel ? `${responseLabel}/${employeeLabel}` : null;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={[
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
            "border-[color:rgb(var(--rsm-yellow-rgb)/0.48)] bg-[rgb(var(--rsm-yellow-rgb)/0.16)] text-[#6f4d00]",
            "hover:bg-[rgb(var(--rsm-yellow-rgb)/0.24)]",
            "dark:border-[color:rgb(var(--rsm-yellow-rgb)/0.52)] dark:bg-[rgb(var(--rsm-yellow-rgb)/0.18)] dark:text-[#ffe8a6] dark:hover:bg-[rgb(var(--rsm-yellow-rgb)/0.26)]",
            className,
          ].join(" ")}
          aria-label="Advertencia de baja participación ONA"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-[var(--rsm-yellow)]" />
          <span>Baja participación</span>
        </button>
      </HoverCardTrigger>

      <HoverCardContent
        side={side}
        align={align}
        className="
          w-[320px] rounded-2xl
          border border-[color:rgb(var(--rsm-yellow-rgb)/0.5)]
          bg-[#fff7df] p-4
          text-[#6f4d00]
          shadow-xl
          dark:border-[color:rgb(var(--rsm-yellow-rgb)/0.56)]
          dark:bg-[#3a2a06]
          dark:text-[#ffe8a6]
        "
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgb(var(--rsm-yellow-rgb)/0.45)] bg-[rgb(var(--rsm-yellow-rgb)/0.2)]">
            <AlertTriangle className="h-4 w-4 text-[var(--rsm-yellow)]" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold">
              Baja participación en Impact Survey
            </div>
            <p className="mt-2 text-sm leading-6 text-[#765300] dark:text-[#ffe9ad]">
              La participación de esta sociedad/oficina está por debajo del
              50%. Interpreta los insights ONA y la red organizacional con
              cautela.
            </p>
          </div>
        </div>

        {(rateLabel || countLabel) && (
          <div className="mt-4 rounded-xl border border-[color:rgb(var(--rsm-yellow-rgb)/0.36)] bg-[rgb(var(--rsm-yellow-rgb)/0.18)] p-3 text-sm dark:bg-[rgb(var(--rsm-yellow-rgb)/0.12)]">
            {rateLabel && (
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">Participación</span>
                <span className="font-semibold">{rateLabel}</span>
              </div>
            )}
            {countLabel && (
              <div className="mt-1 flex items-center justify-between gap-4 text-xs opacity-85">
                <span>Respuestas</span>
                <span className="font-semibold">{countLabel}</span>
              </div>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
