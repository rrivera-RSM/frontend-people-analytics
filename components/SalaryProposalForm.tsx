"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  onChange: (value: ProposalDraft) => void;
  onOpenSimulation: () => void;
};

function normalizeDraft(draft: Partial<ProposalDraft> | null | undefined): ProposalDraft {
  return {
    salaryCurrent: typeof draft?.salaryCurrent === "number" ? draft.salaryCurrent : 0,
    proposedSalary: typeof draft?.proposedSalary === "number" ? draft.proposedSalary : 0,
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
  employee,
  monetaryInfo,
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

  return (
    <Card className="py-3 bg-[var(--exec-card)]">
      <CardHeader>
        <CardTitle className="pt-1">Propuesta salarial</CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => undefined)}>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-2">
              {/* Left column */}
              <div className="space-y-2">
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
                        <FormLabel className="text-xs text-slate-300">
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
                              value={typeof field.value === "number" ? field.value : 0}
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
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="proposedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-300">
                        Propuesta salarial
                      </FormLabel>
                      <FormControl>
                        <MoneyInput
                          value={typeof field.value === "number" ? field.value : 0}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                className="min-w-[120px]"
                onClick={onOpenSimulation}
              >
                Simulate
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
