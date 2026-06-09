"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchEmployeeTimelineEvolution } from "@/lib/api/employee";

export function useEmployeeTimelineEvolution(
  employeeId: number | null | undefined,
) {
  return useQuery({
    queryKey: ["employee", employeeId, "timeline-evolution"],
    queryFn: () => fetchEmployeeTimelineEvolution(employeeId as number),
    enabled: employeeId != null,
    staleTime: 1000 * 60 * 5,
  });
}
