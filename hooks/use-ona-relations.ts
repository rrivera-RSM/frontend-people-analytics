"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOnaRelations } from "@/lib/api/ona";

export function useOnaRelations(societyId: number | null | undefined) {
  return useQuery({
    queryKey: ["ona", "relations", societyId],
    queryFn: () => fetchOnaRelations(societyId as number),
    enabled: societyId != null,
    staleTime: 1000 * 60 * 10,
  });
}
