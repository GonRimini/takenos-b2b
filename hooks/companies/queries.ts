// hooks/companies/queries.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useCompaniesRepository } from "./repository";
import { CompanyLimit } from "@/types/company-types";

export const useCompanyLimitsQuery = (
  companyId?: string,
  enabled: boolean = true
) => {
  const repo = useCompaniesRepository();

  return useQuery<CompanyLimit[]>({
    queryKey: ["company-limits", companyId],
    queryFn: () => repo.loadCompanyLimits(companyId!),
    enabled: enabled && !!companyId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos en cache
  });
};