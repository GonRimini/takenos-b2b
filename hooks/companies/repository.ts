// hooks/companies/repository.tsx
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { CompanyLimit } from "@/types/company-types";

export const useCompaniesRepository = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();

  const loadCompanyLimits = async (
    companyId: string
  ): Promise<CompanyLimit[]> => {
    const params = new URLSearchParams();
    params.set("companyId", companyId);

    const resp = await authenticatedFetch(
      `/api/companies/limits?${params.toString()}`,
      {
        method: "GET",
      }
    );

    const json = await resp.json();

    if (!resp.ok || !json?.ok) {
      throw new Error(json?.error || "Failed to load company limits");
    }

    return Array.isArray(json.data) ? json.data : [];
  };

  return {
    loadCompanyLimits,
  };
};
