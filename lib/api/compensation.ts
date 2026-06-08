import { fetchJsonOrNull } from "@/lib/api/http";
import type {
  SalaryProposalBenchmarkFilters,
  SalaryProposalBenchmarkRow,
} from "@/types/compensation";

export async function fetchSalaryProposalBenchmarks(
  filters: SalaryProposalBenchmarkFilters = {},
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim().length > 0) {
      params.set(key, value);
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      params.set(key, String(value));
    }
  });

  const data = await fetchJsonOrNull<SalaryProposalBenchmarkRow[]>(
    `/api/salary-proposal/kpis${
      params.size > 0 ? `?${params.toString()}` : ""
    }`,
  );

  return Array.isArray(data) ? data : [];
}
