import type { EvaluationScatterLatestCycleResponse } from "@/types/evaluation-scatter";

export async function fetchLatestEvaluationScatter(): Promise<EvaluationScatterLatestCycleResponse> {
  const res = await fetch("/api/evaluations/scatter/latest-cycle", {
    method: "GET",
    credentials: "same-origin",
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
