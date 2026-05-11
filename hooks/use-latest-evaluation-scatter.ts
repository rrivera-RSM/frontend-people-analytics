"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchLatestEvaluationScatter } from "@/lib/api/evaluations";
import type {
  EvaluationScatterLatestCycleResponse,
  EvaluationScatterPoint,
} from "@/types/evaluation-scatter";

export function useLatestEvaluationScatter() {
  const query = useQuery<EvaluationScatterLatestCycleResponse, Error>({
    queryKey: ["evaluations", "scatter", "latest-cycle"],
    queryFn: fetchLatestEvaluationScatter,
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 30, // 30 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const points = useMemo<EvaluationScatterPoint[]>(() => {
    return query.data?.points ?? [];
  }, [query.data]);

  return {
    ...query,
    points,
    cycleYear: query.data?.cycle_year ?? null,
    cycleLabel: query.data?.cycle_label ?? null,
    totalPoints: query.data?.total_points ?? 0,
  };
}
``