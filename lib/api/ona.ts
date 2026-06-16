import { fetchJsonOrNull } from "@/lib/api/http";
import type { OnaRelationsApiResponse } from "@/types/ona-relations";
import type { OnaParticipationRate } from "@/types/ona-participation-rate";

export function fetchOnaRelations(societyId: number) {
  return fetchJsonOrNull<OnaRelationsApiResponse>(
    `/api/ona/relations?society_id=${societyId}`,
  );
}

export function fetchOnaParticipationRate(
  societyId: number,
  officeId: number,
) {
  const params = new URLSearchParams({
    society_id: String(societyId),
    office_id: String(officeId),
  });

  return fetchJsonOrNull<OnaParticipationRate>(
    `/api/ona/participation-rate?${params.toString()}`,
  );
}
