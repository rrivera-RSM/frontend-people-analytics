import { fetchJsonOrNull } from "@/lib/api/http";
import type { EmployeeInsightsResponseApi } from "@/types/employee-insights";
import type { MonetaryInfo, OnaData } from "@/types/employee-data";
import type { EmployeeTimelineEvolutionResponse } from "@/types/timeline-evolution";

export function fetchEmployeeMonetaryInfo(employeeId: number) {
  return fetchJsonOrNull<MonetaryInfo>(`/api/employees/${employeeId}/monetary-info`);
}

export function fetchEmployeeOnaActive(employeeId: number) {
  return fetchJsonOrNull<OnaData>(`/api/ona/${employeeId}/active`);
}

export function fetchEmployeeInsights(employeeId: number) {
  return fetchJsonOrNull<EmployeeInsightsResponseApi>(
    `/api/employees/${employeeId}/insights`,
  );
}

export function fetchEmployeeTimelineEvolution(employeeId: number) {
  return fetchJsonOrNull<EmployeeTimelineEvolutionResponse>(
    `/api/employees/${employeeId}/timeline-evolution`,
  );
}
