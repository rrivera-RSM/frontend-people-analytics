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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  FlaskConical,
  SlidersHorizontal,
} from "lucide-react";

import { MoneyInput } from "@/components/MoneyInput";
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
  value: ProposalDraft | null;
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
  value,
  onChange,
  onOpenSimulation,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: value ?? emptyDraft,
    mode: "onChange",
  });

  // Flag para evitar eco cuando reseteamos desde props externas
  const syncingFromParentRef = React.useRef(false);

  // Watchs por campo (mejor que observar todo el objeto)
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
  }, [value, form]);

  // -----------------------------
  // Form -> padre
  // -----------------------------
  React.useEffect(() => {
    if (!value) return;
    if (syncingFromParentRef.current) return;

    const nextDraft = normalizeDraft({
      salaryCurrent: value.salaryCurrent,
      proposedSalary,
      bonus,
      category,
    });

    const normalizedValue = normalizeDraft(value);

    if (sameDraft(nextDraft, normalizedValue)) return;

    onChange(nextDraft);
  }, [proposedSalary, bonus, category, value, onChange]);

  if (!value) {
    return <LoadingSkeleton />;
  }

  const raiseAmount = proposedSalary - value.salaryCurrent;
  const raisePct =
    value.salaryCurrent > 0 ? (raiseAmount / value.salaryCurrent) * 100 : 0;

  return (
    <Card className="min-h-[640px] border-slate-200 bg-white/90 py-0 shadow-sm dark:border-slate-700/90 dark:bg-slate-800/80">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <Banknote className="h-5 w-5 text-[var(--rsm-blue)] dark:text-[#79d7ff]" />
          <CardTitle className="text-xl text-slate-900 dark:text-slate-50">Nueva propuesta</CardTitle>
        </div>

        <button
          type="button"
          aria-label="Ajustes de compensación"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 py-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => undefined)}
            className="flex flex-1 flex-col"
          >
            <div className="mb-5 rounded-lg border border-[color:rgb(var(--rsm-blue-rgb)/0.18)] bg-[rgb(var(--rsm-blue-rgb)/0.06)] px-4 py-3 text-sm text-[#005c86] dark:text-[#d8f6ff]">
              Define solo las condiciones nuevas que quieres simular para el empleado.
            </div>

            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Propuesta nuevo salario
                </div>
                <FormField
                  control={form.control}
                  name="proposedSalary"
                  render={({ field }) => (
                    <FormItem>
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
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Variación propuesta</span>
                  <span className="font-medium text-[var(--rsm-blue)] dark:text-[#79d7ff]">
                    {raiseAmount >= 0 ? "+" : ""}
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 2,
                    }).format(raiseAmount)}
                    {" · "}
                    {raisePct >= 0 ? "+" : ""}
                    {raisePct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Nueva categoría
                </div>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          value={(field.value as string) ?? ""}
                          onChange={field.onChange}
                          placeholder="Mantener categoría actual o indicar nueva"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2.5 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Importe bonus desempeño
                </div>
                <FormField
                  control={form.control}
                  name="bonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MoneyInput
                          value={
                            typeof field.value === "number"
                              ? field.value
                              : 0
                          }
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  El flujo actual solo soporta un bonus agregado para simulación. Si más adelante añadimos bonus por tipo o mes de pago, lo conectamos aquí.
                </p>
              </div>
            </div>

            <div className="mt-auto border-t border-slate-200 pt-5 dark:border-slate-700">
              <Button
                type="button"
                className={cn(
                  "h-12 w-full gap-2 rounded-lg bg-[var(--rsm-blue)] text-base font-semibold text-white transition-all duration-200 hover:bg-[#0086c0]",
                  "shadow-[0_8px_24px_rgba(0,156,222,0.28)]",
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
