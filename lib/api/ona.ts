import { fetchJsonOrNull } from "@/lib/api/http";
import type { OnaRelationsApiResponse } from "@/types/ona-relations";

export function fetchOnaRelations(societyId: number) {
  return fetchJsonOrNull<OnaRelationsApiResponse>(
    `/api/ona/relations?society_id=${societyId}`,
  );
}
