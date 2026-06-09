"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import {
  fetchEmployeeInsights,
  fetchEmployeeMonetaryInfo,
  fetchEmployeeOnaActive,
} from "@/lib/api/employee";

export function useEmployeePanelData(employeeId: number | null | undefined) {
  const enabled = employeeId != null;

  const [monetaryQuery, onaQuery, insightsQuery] = useQueries({
    queries: [
      {
        queryKey: ["employee", employeeId, "monetary-info"],
        queryFn: () => fetchEmployeeMonetaryInfo(employeeId as number),
        enabled,
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: ["employee", employeeId, "ona-active"],
        queryFn: () => fetchEmployeeOnaActive(employeeId as number),
        enabled,
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: ["employee", employeeId, "insights"],
        queryFn: () => fetchEmployeeInsights(employeeId as number),
        enabled,
        staleTime: 1000 * 60 * 5,
      },
    ],
  });

  return useMemo(
    () => ({
      monetaryInfo: monetaryQuery.data ?? null,
      monetaryInfoLoading: monetaryQuery.isLoading,
      onaData: onaQuery.data ?? null,
      onaDataLoading: onaQuery.isLoading,
      insightsData: insightsQuery.data ?? null,
      insightsLoading: insightsQuery.isLoading,
      anyFetching:
        monetaryQuery.isFetching || onaQuery.isFetching || insightsQuery.isFetching,
      error:
        monetaryQuery.error ?? onaQuery.error ?? insightsQuery.error ?? null,
    }),
    [
      insightsQuery.data,
      insightsQuery.error,
      insightsQuery.isFetching,
      insightsQuery.isLoading,
      monetaryQuery.data,
      monetaryQuery.error,
      monetaryQuery.isFetching,
      monetaryQuery.isLoading,
      onaQuery.data,
      onaQuery.error,
      onaQuery.isFetching,
      onaQuery.isLoading,
    ],
  );
}
