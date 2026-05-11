"use client";

import { useMemo } from "react";
import { useLatestEvaluationScatter } from "@/hooks/use-latest-evaluation-scatter";
import type { EvaluationScatterPoint } from "@/types/evaluation-scatter";

type Result = {
  allPoints: EvaluationScatterPoint[];
  selectedPoint: EvaluationScatterPoint | null;
  sameSocietyPoints: EvaluationScatterPoint[];
  sameDepartmentPoints: EvaluationScatterPoint[];
  otherPoints: EvaluationScatterPoint[];
};

export function useEvaluationScatterSelection(
  selectedEmployeeId: number | null | undefined,
): Result & {
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  cycleYear: number | null;
  cycleLabel: string | null;
  totalPoints: number;
  refetch: () => void;
} {
  const {
    points,
    cycleYear,
    cycleLabel,
    totalPoints,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLatestEvaluationScatter();

  const derived = useMemo<Result>(() => {
    if (!selectedEmployeeId) {
      return {
        allPoints: points,
        selectedPoint: null,
        sameSocietyPoints: [],
        sameDepartmentPoints: [],
        otherPoints: points,
      };
    }

    const selectedPoint =
      points.find((p) => p.employee_id === selectedEmployeeId) ?? null;

    if (!selectedPoint) {
      return {
        allPoints: points,
        selectedPoint: null,
        sameSocietyPoints: [],
        sameDepartmentPoints: [],
        otherPoints: points,
      };
    }

    /**
     * Priorizamos departamento sobre sociedad
     * para evitar solapes visuales.
     */
    const sameDepartmentPoints = points.filter(
      (p) =>
        p.employee_id !== selectedEmployeeId &&
        p.department_id != null &&
        selectedPoint.department_id != null &&
        p.department_id === selectedPoint.department_id,
    );

    const sameDepartmentIds = new Set(
      sameDepartmentPoints.map((p) => p.employee_id),
    );

    const sameSocietyPoints = points.filter(
      (p) =>
        p.employee_id !== selectedEmployeeId &&
        !sameDepartmentIds.has(p.employee_id) &&
        p.society_id != null &&
        selectedPoint.society_id != null &&
        p.society_id === selectedPoint.society_id,
    );

    const sameSocietyIds = new Set(
      sameSocietyPoints.map((p) => p.employee_id),
    );

    const otherPoints = points.filter(
      (p) =>
        p.employee_id !== selectedEmployeeId &&
        !sameDepartmentIds.has(p.employee_id) &&
        !sameSocietyIds.has(p.employee_id),
    );

    return {
      allPoints: points,
      selectedPoint,
      sameSocietyPoints,
      sameDepartmentPoints,
      otherPoints,
    };
  }, [points, selectedEmployeeId]);

  return {
    ...derived,
    isLoading,
    isFetching,
    error: error ?? null,
    cycleYear,
    cycleLabel,
    totalPoints,
    refetch: () => {
      void refetch();
    },
  };
}