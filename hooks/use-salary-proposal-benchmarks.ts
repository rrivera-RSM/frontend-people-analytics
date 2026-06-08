"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchSalaryProposalBenchmarks } from "@/lib/api/compensation";
import type { SalaryProposalBenchmarkFilters } from "@/types/compensation";

export function useSalaryProposalBenchmarks(
  filters: SalaryProposalBenchmarkFilters,
  enabled = true,
) {
  const query = useQuery({
    queryKey: ["salary-proposal", "benchmarks", filters],
    queryFn: () => fetchSalaryProposalBenchmarks(filters),
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);

  return {
    ...query,
    rows,
  };
}
