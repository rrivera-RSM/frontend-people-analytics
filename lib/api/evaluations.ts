import { fetchWithSessionRefresh } from "@/lib/api/http";
import type { EvaluationScatterLatestCycleResponse } from "@/types/evaluation-scatter";

export async function fetchLatestEvaluationScatter(): Promise<EvaluationScatterLatestCycleResponse> {
  const res = await fetchWithSessionRefresh("/api/evaluations/scatter/latest-cycle", {
    method: "GET",
  });

  if (!res.ok) {
    let message = `No se pudo recuperar el scatter de evaluaciones (${res.status})`;

    try {
      const body = await res.json();

      if (body?.message) {
        message = body.message;
      } else if (body?.detail) {
        message = body.detail;
      }
    } catch {
      // noop: mantenemos el mensaje por defecto
    }

    throw new Error(message);
  }

  return res.json();
}
