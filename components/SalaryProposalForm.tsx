import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { ProposalInputs } from "@/utils/kpis";

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

import { MoneyInput } from "@/components/MoneyInput";
import { EmployeeRow } from "./EmployeeCard";
import { MonetaryInfo } from "@/components/EmployeeView";

const schema = z.object({
  salaryCurrent: z.number().nonnegative(),
  bonus: z.number().nonnegative(),
  category: z.string().min(1),
  proposedSalary: z.number().nonnegative(),
  comments: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

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
  onValuesChange?: (values: ProposalInputs) => void;
};

export function SalaryProposalForm({
  employee,
  monetaryInfo,
  onValuesChange,
}: Props) {
  if (!monetaryInfo) return <LoadingSkeleton />;

  const defaultProposed = round2(monetaryInfo.salary * 1.02);
  const defaultValues: FormValues = {
    salaryCurrent: monetaryInfo.salary,
    bonus: monetaryInfo.bonus,
    category: employee.category_name ?? "",
    proposedSalary: defaultProposed,
    comments: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  React.useEffect(() => {
    form.reset(defaultValues);

    onValuesChange?.({
      salaryCurrent: defaultValues.salaryCurrent,
      proposedSalary: defaultValues.proposedSalary,
      bonus: defaultValues.bonus,
    });
  }, [employee.category_name, monetaryInfo.salary, monetaryInfo.bonus, form]);

  const salaryCurrent = useWatch({
    control: form.control,
    name: "salaryCurrent",
  });
  const proposedSalary = useWatch({
    control: form.control,
    name: "proposedSalary",
  });
  const bonus = useWatch({ control: form.control, name: "bonus" });

  React.useEffect(() => {
    if (!onValuesChange) return;

    // Aseguramos números (por si viniera undefined en algún caso)
    const sc = typeof salaryCurrent === "number" ? salaryCurrent : 0;
    const ps = typeof proposedSalary === "number" ? proposedSalary : 0;
    const b = typeof bonus === "number" ? bonus : 0;

    onValuesChange({ salaryCurrent: sc, proposedSalary: ps, bonus: b });
  }, [salaryCurrent, proposedSalary, bonus, onValuesChange]);

  return (
    <Card className="py-3 bg-[var(--exec-card)]">
      <CardHeader>
        <CardTitle className="pt-1">Propuesta salarial</CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => console.log(values))}>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
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
                            <Input {...field} readOnly />
                          ) : (
                            <MoneyInput
                              value={field.value as number}
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
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={defaultProposed.toString()}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
