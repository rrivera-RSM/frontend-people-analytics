// lib/insight-placement.ts
import type { EmployeeInsightItemApi } from "@/types/employee-insights";

export type InsightPlacement =
  | "ona_chart"
  | "performance_chart"
  | "compensation_modal";

export function getInsightPlacement(
  insight: EmployeeInsightItemApi,
): InsightPlacement {
  switch (insight.code) {
    // --- ONA RADAR ---
    case "active_influence_ci":
    case "active_influence_at":
    case "active_influence_ap":
    case "active_influence_in":
      return "ona_chart";

    // --- PERFORMANCE CHART ---
    case "high_solid_performance":
    case "hidden_risk":
    case "potential":
    case "stagnant":
    case "recovery":
    case "critical":
      return "performance_chart";

    // --- EVERYTHING ELSE ---
    default:
      return "compensation_modal";
  }
}
