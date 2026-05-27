"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Banknote, FlaskConical, SlidersHorizontal, TrendingUp } from "lucide-react";

import { MoneyInput } from "@/components/MoneyInput";
import { EmployeeRow } from "./EmployeeCard";
import { MonetaryInfo } from "@/components/EmployeeView";
import type { ProposalDraft } from "@/types/compensation";

const schema = z.object({
  salaryCurrent: z.number().nonnegative(),
  bonus: z.number().nonnegative(),
  category: z.string(),
  proposedSalary: z.number().nonnegative(),
});

type FormValues = z.infer<typeof schema>;

const emptyDraft: ProposalDraft = {
  salaryCurrent: 0,
  proposedSalary: 0,
  bonus: 0,
  category: "",
};

const AVG_SALARY_REFERENCE = 30000;
const AVG_BONUS_REFERENCE = 2000;

const LoadingSkeleton = () => (
  <Card className="shrink-0 bg-[var(--exec-card)]">
    <CardHeader>
      <CardTitle className="text-base">Propuesta salarial</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[...Array(2)].map((_, col) => (
        <div key={col} className="space-y-4">
          {[...Array(3)].map((_, row) => (
            <React.Fragment key={row}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </React.Fragment>
          ))}
        </div>
      ))}
    </CardContent>
  </Card>
);

type Props = {
  employee: EmployeeRow;
  monetaryInfo: MonetaryInfo | null;
  value: ProposalDraft | null;
  hasInsights: boolean;
  onChange: (value: ProposalDraft) => void;
  onOpenSimulation: () => void;
};

function normalizeDraft(
  draft: Partial<ProposalDraft> | null | undefined,
): ProposalDraft {
  return {
    salaryCurrent:
      typeof draft?.salaryCurrent === "number" ? draft.salaryCurrent : 0,
    proposedSalary:
      typeof draft?.proposedSalary === "number" ? draft.proposedSalary : 0,
    bonus: typeof draft?.bonus === "number" ? draft.bonus : 0,
    category: typeof draft?.category === "string" ? draft.category : "",
  };
}

function sameDraft(a: ProposalDraft | null, b: ProposalDraft | null) {
  if (!a || !b) return false;

  return (
    a.salaryCurrent === b.salaryCurrent &&
    a.proposedSalary === b.proposedSalary &&
    a.bonus === b.bonus &&
    a.category === b.category
  );
}

export function SalaryProposalForm({
  monetaryInfo,
  value,
  onChange,
  onOpenSimulation,
  hasInsights,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: value ?? emptyDraft,
    mode: "onChange",
  });

  // Flag para evitar eco cuando reseteamos desde props externas
  const syncingFromParentRef = React.useRef(false);

  // Watchs por campo (mejor que observar todo el objeto)
  const salaryCurrent = useWatch({
    control: form.control,
    name: "salaryCurrent",
  });

  const proposedSalary = useWatch({
    control: form.control,
    name: "proposedSalary",
  });

  const bonus = useWatch({
    control: form.control,
    name: "bonus",
  });

  const category = useWatch({
    control: form.control,
    name: "category",
  });

  // -----------------------------
  // Padre -> form
  // -----------------------------
  React.useEffect(() => {
    if (!value) return;

    const normalizedValue = normalizeDraft(value);
    const currentForm = normalizeDraft(form.getValues());

    if (sameDraft(currentForm, normalizedValue)) return;

    syncingFromParentRef.current = true;
    form.reset(normalizedValue);

    // Soltamos el flag en microtask para dejar que RHF termine el reset
    queueMicrotask(() => {
      syncingFromParentRef.current = false;
    });
  }, [
    value?.salaryCurrent,
    value?.proposedSalary,
    value?.bonus,
    value?.category,
    form,
  ]);

  // -----------------------------
  // Form -> padre
  // -----------------------------
  React.useEffect(() => {
    if (!value) return;
    if (syncingFromParentRef.current) return;

    const nextDraft = normalizeDraft({
      salaryCurrent,
      proposedSalary,
      bonus,
      category,
    });

    const normalizedValue = normalizeDraft(value);

    if (sameDraft(nextDraft, normalizedValue)) return;

    onChange(nextDraft);
  }, [
    salaryCurrent,
    proposedSalary,
    bonus,
    category,
    value?.salaryCurrent,
    value?.proposedSalary,
    value?.bonus,
    value?.category,
    onChange,
  ]);

  if (!monetaryInfo || !value) {
    return <LoadingSkeleton />;
  }

  const raiseAmount = proposedSalary - salaryCurrent;
  const raisePct = salaryCurrent > 0 ? (raiseAmount / salaryCurrent) * 100 : 0;
  const salaryVsAvgPct =
    AVG_SALARY_REFERENCE > 0
      ? ((proposedSalary - AVG_SALARY_REFERENCE) / AVG_SALARY_REFERENCE) * 100
      : 0;
  const bonusVsAvgPct =
    AVG_BONUS_REFERENCE > 0
      ? ((bonus - AVG_BONUS_REFERENCE) / AVG_BONUS_REFERENCE) * 100
      : 0;

  return (
    <Card className="min-h-[640px] border-slate-700/90 bg-slate-800/80 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-700/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <Banknote className="h-5 w-5 text-cyan-300" />
          <CardTitle className="text-xl text-slate-50">Compensación</CardTitle>
        </div>

        <button
          type="button"
          aria-label="Ajustes de compensación"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 py-5">
        <div className="mb-5 rounded-lg border border-slate-700 bg-slate-950/45 p-4">
          <div className="text-xs font-medium text-slate-400">
            Referencia Comparativa
          </div>
          <div className="mt-2 flex h-10 items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 text-sm font-semibold text-slate-100">
            <span className="truncate">RSM Spain · People & Culture · Barcelona</span>
            <span className="text-slate-500">⌄</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-4">
            <div className="text-xs text-slate-400">% vs salario prom.</div>
            <div className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-50">
              {salaryVsAvgPct >= 0 ? "+" : ""}
              {salaryVsAvgPct.toFixed(1)}%
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-4">
            <div className="text-xs text-slate-400">% vs bonus prom.</div>
            <div className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-50">
              {bonusVsAvgPct >= 0 ? "+" : ""}
              {bonusVsAvgPct.toFixed(1)}%
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => undefined)}
            className="flex flex-1 flex-col"
          >
            <div className="mb-4 border-b border-slate-700 pb-3 text-base font-semibold text-slate-50">
              Propuesta Salarial
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Left column */}
              <div className="space-y-3">
                {[
                  {
                    name: "salaryCurrent" as const,
                    label: "Salario actual",
                    readOnly: true,
                  },
                  { name: "bonus" as const, label: "Bonus" },
                  {
                    name: "category" as const,
                    label: "Categoría",
                    readOnly: true,
                  },
                ].map(({ name, label, readOnly }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-400">
                          {label}
                        </FormLabel>
                        <FormControl>
                          {name === "category" ? (
                            <Input
                              value={(field.value as string) ?? ""}
                              onChange={field.onChange}
                              readOnly
                            />
                          ) : (
                            <MoneyInput
                              value={
                                typeof field.value === "number"
                                  ? field.value
                                  : 0
                              }
                              onChange={field.onChange}
                              readOnly={readOnly}
                              onBlur={field.onBlur}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* Right column */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="proposedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-cyan-300">
                        Propuesta salarial FY 2026-2027
                      </FormLabel>
                      <FormControl>
                        <MoneyInput
                          value={
                            typeof field.value === "number" ? field.value : 0
                          }
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Aumento: {raiseAmount.toLocaleString("es-ES")} €</span>
                  <span className="text-cyan-300">
                    {raisePct >= 0 ? "+" : ""}
                    {raisePct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-slate-700 pt-5">
              <Button
                type="button"
                className={cn(
                  "h-12 w-full gap-2 rounded-lg bg-blue-500 text-base font-semibold text-white transition-all duration-200 hover:bg-blue-400",
                  hasInsights 
                    ? "shadow-[0_8px_24px_rgba(59,130,246,0.28)]"
                    : "",
                )}
                onClick={onOpenSimulation}
              >
                <FlaskConical className="h-4 w-4" />
                Simular impacto
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
