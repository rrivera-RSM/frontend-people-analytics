import { fetchJsonOrNull, postJson } from "@/lib/api/http";
import type {
  SalaryOffer,
  SalaryOfferPayload,
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

export async function saveSalaryOffer(payload: SalaryOfferPayload) {
  return postJson<SalaryOfferPayload, SalaryOffer>(
    "/api/salary-proposal/offers",
    payload,
  );
}

export async function fetchLatestSalaryOffer(employeeId: number) {
  return fetchJsonOrNull<SalaryOffer>(
    `/api/salary-proposal/offers?employee_id=${employeeId}`,
  );
}
