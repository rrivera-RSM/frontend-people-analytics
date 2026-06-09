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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  Check,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";

import { MoneyInput } from "@/components/MoneyInput";
import type { ProposalDraft } from "@/types/compensation";

const schema = z.object({
  salaryCurrent: z.number().nonnegative(),
  includeBonus: z.boolean(),
  includeNextFiscalYearBonus: z.boolean(),
  includeCategory: z.boolean(),
  bonus: z.number().nonnegative(),
  nextFiscalYearBonus: z.number().nonnegative(),
  category: z.string(),
  proposedSalary: z.number().nonnegative(),
  bonusPaymentMonth: z.string(),
  observations: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyDraft: ProposalDraft = {
  salaryCurrent: 0,
  proposedSalary: 0,
  bonus: 0,
  nextFiscalYearBonus: 0,
  category: "",
  includeBonus: false,
  includeNextFiscalYearBonus: false,
  includeCategory: false,
  bonusPaymentMonth: "",
  observations: "",
};

const BONUS_PAYMENT_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

const CATEGORY_ORDER = [
  "becario",
  "junior",
  "senior",
  "manager",
  "director",
] as const;

function normalizeCategoryValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function calculateIncreasePercentage(
  salaryCurrent: number,
  proposedSalary: number,
) {
  if (salaryCurrent <= 0) return 0;
  return ((proposedSalary - salaryCurrent) / salaryCurrent) * 100;
}

function getAllowedCategoryOptions(currentCategory: string | null | undefined) {
  const normalizedCurrent = normalizeCategoryValue(currentCategory);
  const currentIndex = CATEGORY_ORDER.indexOf(
    normalizedCurrent as (typeof CATEGORY_ORDER)[number],
  );

  if (currentIndex === -1) {
    return currentCategory ? [currentCategory] : [];
  }

  return CATEGORY_ORDER.slice(currentIndex).map((category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  });
}

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
  onSave?: (value: ProposalDraft) => void;
  onOpenSimulation: () => void;
  isSaved?: boolean;
  demoMode?: boolean;
};

function normalizeDraft(
  draft: Partial<ProposalDraft> | null | undefined,
): ProposalDraft {
  return {
    salaryCurrent:
      typeof draft?.salaryCurrent === "number" ? draft.salaryCurrent : 0,
    currentBonus:
      typeof draft?.currentBonus === "number" ? draft.currentBonus : undefined,
    currentCategoryId:
      typeof draft?.currentCategoryId === "number"
        ? draft.currentCategoryId
        : undefined,
    currentCategory:
      typeof draft?.currentCategory === "string" ? draft.currentCategory : "",
    proposedSalary:
      typeof draft?.proposedSalary === "number" ? draft.proposedSalary : 0,
    increasePercentage:
      typeof draft?.increasePercentage === "number"
        ? draft.increasePercentage
        : calculateIncreasePercentage(
            typeof draft?.salaryCurrent === "number" ? draft.salaryCurrent : 0,
            typeof draft?.proposedSalary === "number" ? draft.proposedSalary : 0,
          ),
    includeBonus:
      typeof draft?.includeBonus === "boolean" ? draft.includeBonus : false,
    includeNextFiscalYearBonus:
      typeof draft?.includeNextFiscalYearBonus === "boolean"
        ? draft.includeNextFiscalYearBonus
        : false,
    includeCategory:
      typeof draft?.includeCategory === "boolean" ? draft.includeCategory : false,
    bonus: typeof draft?.bonus === "number" ? draft.bonus : 0,
    nextFiscalYearBonus:
      typeof draft?.nextFiscalYearBonus === "number"
        ? draft.nextFiscalYearBonus
        : 0,
    category: typeof draft?.category === "string" ? draft.category : "",
    bonusPaymentMonth:
      typeof draft?.bonusPaymentMonth === "string" ? draft.bonusPaymentMonth : "",
    observations:
      typeof draft?.observations === "string" ? draft.observations : "",
  };
}

function sameDraft(a: ProposalDraft | null, b: ProposalDraft | null) {
  if (!a || !b) return false;

  return (
    a.salaryCurrent === b.salaryCurrent &&
    a.currentBonus === b.currentBonus &&
    a.currentCategoryId === b.currentCategoryId &&
    a.currentCategory === b.currentCategory &&
    a.proposedSalary === b.proposedSalary &&
    a.increasePercentage === b.increasePercentage &&
    a.includeBonus === b.includeBonus &&
    a.includeNextFiscalYearBonus === b.includeNextFiscalYearBonus &&
    a.includeCategory === b.includeCategory &&
    a.bonus === b.bonus &&
    a.nextFiscalYearBonus === b.nextFiscalYearBonus &&
    a.category === b.category &&
    a.bonusPaymentMonth === b.bonusPaymentMonth &&
    a.observations === b.observations
  );
}

export function SalaryProposalForm({
  value,
  onChange,
  onSave,
  onOpenSimulation,
  isSaved = false,
  demoMode = false,
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

  const nextFiscalYearBonus = useWatch({
    control: form.control,
    name: "nextFiscalYearBonus",
  });

  const includeBonus = useWatch({
    control: form.control,
    name: "includeBonus",
  });

  const includeNextFiscalYearBonus = useWatch({
    control: form.control,
    name: "includeNextFiscalYearBonus",
  });

  const category = useWatch({
    control: form.control,
    name: "category",
  });

  const includeCategory = useWatch({
    control: form.control,
    name: "includeCategory",
  });

  const bonusPaymentMonth = useWatch({
    control: form.control,
    name: "bonusPaymentMonth",
  });

  const observations = useWatch({
    control: form.control,
    name: "observations",
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
      currentBonus: value.currentBonus,
      currentCategoryId: value.currentCategoryId,
      currentCategory: value.currentCategory,
      proposedSalary,
      increasePercentage: calculateIncreasePercentage(
        value.salaryCurrent,
        proposedSalary,
      ),
      includeBonus,
      includeNextFiscalYearBonus,
      includeCategory,
      bonus,
      nextFiscalYearBonus,
      category,
      bonusPaymentMonth,
      observations,
    });

    const normalizedValue = normalizeDraft(value);

    if (sameDraft(nextDraft, normalizedValue)) return;

    onChange(nextDraft);
  }, [
    proposedSalary,
    includeBonus,
    includeNextFiscalYearBonus,
    bonus,
    nextFiscalYearBonus,
    includeCategory,
    category,
    bonusPaymentMonth,
    observations,
    value,
    onChange,
  ]);

  const currentBonus = value?.currentBonus ?? value?.bonus ?? 0;
  const currentCategory = value?.currentCategory ?? value?.category ?? "";
  const allowedCategoryOptions = getAllowedCategoryOptions(currentCategory);

  React.useEffect(() => {
    if (!includeBonus) {
      form.setValue("bonus", currentBonus, { shouldDirty: true });
      form.setValue("bonusPaymentMonth", "", { shouldDirty: true });
    }
  }, [includeBonus, currentBonus, form]);

  React.useEffect(() => {
    if (!includeNextFiscalYearBonus) {
      form.setValue("nextFiscalYearBonus", 0, { shouldDirty: true });
    }
  }, [includeNextFiscalYearBonus, form]);

  React.useEffect(() => {
    if (!includeCategory) {
      form.setValue("category", currentCategory, { shouldDirty: true });
      return;
    }

    const normalizedCategory = normalizeCategoryValue(form.getValues("category"));
    const allowedNormalized = allowedCategoryOptions.map((option) =>
      normalizeCategoryValue(option),
    );

    if (
      allowedNormalized.length > 0 &&
      !allowedNormalized.includes(normalizedCategory)
    ) {
      form.setValue("category", allowedCategoryOptions[0] ?? currentCategory, {
        shouldDirty: true,
      });
    }
  }, [includeCategory, currentCategory, allowedCategoryOptions, form]);

  React.useEffect(() => {
    if (!demoMode || !form.getValues("includeCategory")) return;
    form.setValue("includeCategory", false, { shouldDirty: true });
    form.setValue("category", currentCategory, { shouldDirty: true });
  }, [demoMode, currentCategory, form]);

  if (!value) {
    return <LoadingSkeleton />;
  }

  const raiseAmount = proposedSalary - value.salaryCurrent;
  const raisePct = calculateIncreasePercentage(
    value.salaryCurrent,
    proposedSalary,
  );
  const hasProposedSalary = proposedSalary > 0;

  const handleSave = (formValues: FormValues) => {
    if (formValues.proposedSalary <= 0) return;

    const nextDraft = normalizeDraft({
      ...value,
      ...formValues,
      increasePercentage: calculateIncreasePercentage(
        value.salaryCurrent,
        formValues.proposedSalary,
      ),
    });

    if (!sameDraft(nextDraft, normalizeDraft(value))) {
      onChange(nextDraft);
    }

    onSave?.(nextDraft);
  };

  return (
    <Card
      className={cn(
        "min-h-[640px] py-0 shadow-sm transition-colors duration-300",
        isSaved
          ? "border-[color:rgb(var(--rsm-green-rgb)/0.42)] bg-[linear-gradient(180deg,rgb(var(--rsm-green-rgb)/0.1),var(--exec-card)_30%)] shadow-[0_12px_32px_rgba(63,156,53,0.12)] dark:border-[color:rgb(var(--rsm-green-rgb)/0.5)] dark:bg-[linear-gradient(180deg,rgb(var(--rsm-green-rgb)/0.16),rgb(30,41,59)_34%)]"
          : "border-slate-200 bg-[var(--exec-card)] dark:border-slate-700/90 dark:bg-slate-800/80",
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between gap-3 border-b px-5 py-5 transition-colors duration-300",
          isSaved
            ? "border-[color:rgb(var(--rsm-green-rgb)/0.28)]"
            : "border-slate-200 dark:border-slate-700/80",
        )}
      >
        <div className="flex items-center gap-3">
          <Banknote
            className={cn(
              "h-5 w-5",
              isSaved
                ? "text-[var(--rsm-green)] dark:text-[#8ed989]"
                : "text-[var(--rsm-blue)] dark:text-[#79d7ff]",
            )}
          />
          <div className="min-w-0">
            <CardTitle className="text-xl text-slate-900 dark:text-slate-50">
              Nueva propuesta
            </CardTitle>
            {isSaved && (
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[color:rgb(var(--rsm-green-rgb)/0.3)] bg-[rgb(var(--rsm-green-rgb)/0.1)] px-2 py-0.5 text-xs font-semibold text-[var(--rsm-green)] dark:text-[#8ed989]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Guardada
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label="Simular impacto"
          title="Simular impacto"
          onClick={onOpenSimulation}
          disabled={!hasProposedSalary}
          className="inline-flex aspect-square h-16 flex-col items-center justify-center gap-1 rounded-lg bg-[var(--rsm-blue)] text-[10px] font-semibold leading-tight text-white shadow-[0_8px_24px_rgba(0,156,222,0.28)] transition-all duration-200 hover:bg-[#0086c0] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <FlaskConical className="h-5 w-5" />
          <span className="text-center">Simular impacto</span>
        </button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 py-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="flex flex-1 flex-col"
          >
            <div className="space-y-4">
              <div className="space-y-2.5">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Propuesta nuevo salario a partir de septiembre
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
                          placeholder="Introduce la propuesta salarial aquí"
                          showZeroAsEmpty
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Variación propuesta</span>
                  <span className="font-medium text-[var(--rsm-blue)] dark:text-[#79d7ff]">
                    {hasProposedSalary ? (
                      <>
                        {raiseAmount >= 0 ? "+" : ""}
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 2,
                        }).format(raiseAmount)}
                        {" · "}
                        {raisePct >= 0 ? "+" : ""}
                        {raisePct.toFixed(1)}%
                      </>
                    ) : (
                      "Pendiente"
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={Boolean(includeBonus)}
                    onChange={(event) => {
                      form.setValue("includeBonus", event.target.checked, {
                        shouldDirty: true,
                      });
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[var(--rsm-blue)] focus:ring-[var(--rsm-blue)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900"
                  />
                  <span>Importe bonus desempeño (nuevo)</span>
                </label>
                <FormField
                  control={form.control}
                  name="bonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MoneyInput
                          value={includeBonus ? field.value ?? 0 : currentBonus}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          disabled={!includeBonus}
                          placeholder="Introduce el bonus de desempeño"
                          showZeroAsEmpty
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Mes de pago del bonus
                </div>
                <FormField
                  control={form.control}
                  name="bonusPaymentMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <select
                          value={(field.value as string) ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          disabled={!includeBonus}
                          className={cn(
                            "h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition-[color,box-shadow]",
                            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                            "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark] dark:disabled:bg-slate-950 dark:disabled:text-slate-500",
                          )}
                        >
                          <option value="">Seleccionar mes</option>
                          {BONUS_PAYMENT_MONTHS.map((month) => (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={Boolean(includeNextFiscalYearBonus)}
                    onChange={(event) => {
                      form.setValue(
                        "includeNextFiscalYearBonus",
                        event.target.checked,
                        { shouldDirty: true },
                      );
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[var(--rsm-blue)] focus:ring-[var(--rsm-blue)] dark:border-slate-600 dark:bg-slate-900"
                  />
                  <span>Bonus para próximo ejercicio fiscal</span>
                </label>
                <FormField
                  control={form.control}
                  name="nextFiscalYearBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MoneyInput
                          value={field.value ?? 0}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          disabled={!includeNextFiscalYearBonus}
                          placeholder="Introduce el bonus previsto"
                          showZeroAsEmpty
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {demoMode ? (
                <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Categoría
                  </div>
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-100/80 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                    Oculta en modo demo para no exponer la estructura interna.
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <input
                      type="checkbox"
                      checked={Boolean(includeCategory)}
                      onChange={(event) => {
                        form.setValue("includeCategory", event.target.checked, {
                          shouldDirty: true,
                        });
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[var(--rsm-blue)] focus:ring-[var(--rsm-blue)] dark:border-slate-600 dark:bg-slate-900"
                    />
                    <span>Nueva categoría (si hay)</span>
                  </label>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <select
                            value={
                              includeCategory
                                ? (field.value as string) ?? ""
                                : currentCategory
                            }
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            disabled={!includeCategory}
                            className={cn(
                              "h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition-[color,box-shadow]",
                              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                              "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark] dark:disabled:bg-slate-950 dark:disabled:text-slate-500",
                            )}
                          >
                            {!includeCategory ? (
                              <option value={currentCategory}>
                                {currentCategory || "Sin categoría"}
                              </option>
                            ) : (
                              allowedCategoryOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))
                            )}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-700">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Observaciones
                </div>
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          value={(field.value as string) ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Añade aquí cualquier comentario adicional sobre la propuesta"
                          className="min-h-24 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-auto border-t border-slate-200 pt-5 dark:border-slate-700">
              <Button
                type="submit"
                className={cn(
                  "h-12 w-full gap-2 rounded-lg bg-[var(--rsm-green)] text-base font-semibold text-white transition-all duration-200 hover:bg-[#2f7d28]",
                  "shadow-[0_8px_24px_rgba(63,156,53,0.28)]",
                  isSaved
                    ? "bg-[#2f7d28] shadow-[0_8px_24px_rgba(63,156,53,0.18)]"
                    : "",
                )}
                disabled={!hasProposedSalary}
              >
                {isSaved ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isSaved ? "Propuesta guardada" : "Guardar Propuesta"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
