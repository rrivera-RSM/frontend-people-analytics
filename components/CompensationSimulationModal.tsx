"use client";

import * as React from "react";
import type { EmployeeRow } from "@/components/EmployeeCard";
import type { ProposalDraft, SimulationResult } from "@/types/compensation";
import type { EmployeeInsightViewModel } from "@/types/employee-insights";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { EmployeeInsightsDeck } from "@/components/employee-insights/EmployeeInsightsDeck";
import { AttritionGauge } from "@/components/AttritionGauge";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRow;
  draft: ProposalDraft;
  insights?: EmployeeInsightViewModel[];
  onConfirm: (payload: {
    proposedSalary: number;
    bonus: number;
    simulationResult: SimulationResult;
  }) => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);

const round1 = (n: number) => Math.round(n * 10) / 10;

export function CompensationSimulationModal({
  open,
  onOpenChange,
  employee,
  draft,
  insights = [],
  onConfirm,
}: Props) {
  const [localSalary, setLocalSalary] = React.useState(draft.proposedSalary);
  const [localBonus, setLocalBonus] = React.useState(draft.bonus);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SimulationResult | null>(null);

  React.useEffect(() => {
    if (!open) return;

    setLocalSalary(draft.proposedSalary);
    setLocalBonus(draft.bonus);
    setError(null);
    setResult(null);
  }, [open, draft]);

  const raisePct =
    draft.salaryCurrent > 0
      ? round1(
          ((localSalary - draft.salaryCurrent) / draft.salaryCurrent) * 100,
        )
      : 0;

  /**
   * Baseline actual del empleado.
   * Asumimos escala 0..1.
   * Si en tu EmployeeRow el nombre es distinto, cambia esta línea.
   */
  const baseAttritionProbability =
    typeof employee.attrition_rate === "number"
      ? employee.attrition_rate
      : null;

  /**
   * Mostramos:
   * - simulado si existe
   * - si no, baseline actual
   */
  const displayedProbability =
    result?.attritionProbability ?? baseAttritionProbability;

  const isSimulated = Boolean(result);

  type ApiSimulationResponseItem = {
    id: number;
    probability: number;
    stays: boolean;
  };

  const runSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        employee_id: employee.id,
        new_salary: localSalary,
        new_bonus: localBonus,
        ...(draft.category ? { new_category: draft.category } : {}),
      };

      const res = await fetch("/api/predictive_attrition/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as
        | ApiSimulationResponseItem[]
        | { detail?: string };

      if (!res.ok) {
        throw new Error(
          typeof data === "object" && data && "detail" in data
            ? data.detail || "Error llamando a la simulación"
            : `Simulation failed with status ${res.status}`,
        );
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("La simulación no devolvió resultados");
      }

      const simulationItem =
        data.find((item) => item.id === employee.id) ?? data[0];

      if (typeof simulationItem.probability !== "number") {
        throw new Error("Respuesta de simulación inválida");
      }

      setResult({
        attritionProbability: simulationItem.probability,
        simulatedSalary: localSalary,
        simulatedBonus: localBonus,
        simulatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo ejecutar la simulación",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const employeeName = `${employee.first_name} ${employee.last_name}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          p-0
          flex flex-col
          overflow-hidden

          w-[95vw]
          max-w-[95vw]
          sm:max-w-[95vw]

          h-auto
          max-h-[95vh]

          md:w-[90vw]
          md:h-[88vh]
          md:max-w-[60vw]

          bg-[var(--exec-card)]
        "
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-3 md:px-6 md:pt-6 md:pb-4">
          <DialogTitle className="text-lg md:text-xl">
            Simulación de Compensación
          </DialogTitle>
          <DialogDescription>
            Configura el escenario salarial para <strong>{employeeName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1.02fr_0.98fr]">
          {/* Columna izquierda */}
          <div className="min-h-0 overflow-y-auto border-b p-5 space-y-4 md:border-b-0 md:border-r md:p-6 md:space-y-5">
            <section className="space-y-3 md:space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs">
                Ajustes salariales
              </div>

              <Card className="bg-background/50">
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Categoría
                    </div>
                    <div className="font-medium">{draft.category || "-"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Salario actual
                      </div>
                      <div className="font-medium">
                        {formatCurrency(draft.salaryCurrent)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        Incremento porcentual
                      </div>
                      <div className="font-medium text-primary">
                        {raisePct >= 0 ? "+" : ""}
                        {raisePct}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Nuevo salario bruto anual
                    </div>

                    <MoneyInput value={localSalary} onChange={setLocalSalary} />

                    <div className="text-xs text-muted-foreground">
                      Subida sobre actual:{" "}
                      {formatCurrency(
                        Math.max(0, localSalary - draft.salaryCurrent),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3 md:space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs">
                Bonus
              </div>

              <Card className="bg-background/50">
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Cuantía del bonus (target anual)
                    </div>
                    <MoneyInput value={localBonus} onChange={setLocalBonus} />
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Columna derecha */}
          <div className="min-h-0 overflow-y-auto bg-muted/20 p-5 space-y-4 md:p-6">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs">
              Impacto de la simulación
            </div>

            {/* Riesgo de fuga */}
            <Card>
              <CardContent className="space-y-4 p-4 md:p-5">
               

                {loading && (
                  <div className="rounded-md border p-5 text-sm text-muted-foreground md:p-6">
                    Ejecutando simulación...
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {!loading && displayedProbability != null && (
                  <>
                    <AttritionGauge
                      probability={displayedProbability}
                      minSize={350}
                      maxSize={350}
                      label={
                        isSimulated
                          ? "Riesgo estimado tras simulación"
                          : "Riesgo actual estimado"
                      }
                    />

                    {isSimulated && (
                      <div className="text-xs text-muted-foreground">
                        Simulado para salario{" "}
                        {formatCurrency(result!.simulatedSalary)} y bonus{" "}
                        {formatCurrency(result!.simulatedBonus)}.
                      </div>
                    )}
                  </>
                )}

                {!loading && displayedProbability == null && (
                  <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground md:p-6">
                    No hay información suficiente para estimar el riesgo de fuga actual.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights / contexto */}
            {insights.length > 0 && (
              <EmployeeInsightsDeck
                insights={insights}
                autoPlay
                autoPlayIntervalMs={8500}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 border-t px-5 py-3 md:px-6 md:py-4">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={runSimulation}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Simulando..." : "Ejecutar simulación"}
              </Button>

              <Button
                type="button"
                disabled={!result || loading}
                className="w-full sm:w-auto"
                onClick={() => {
                  if (!result) return;

                  onConfirm({
                    proposedSalary: localSalary,
                    bonus: localBonus,
                    simulationResult: result,
                  });
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
