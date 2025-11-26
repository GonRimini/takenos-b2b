import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDashboardRepository } from "./repository";

const STALE_30M = 30 * 60 * 1000;      // 30 min
const GC_24H    = 24 * 60 * 60 * 1000; // 24 hs

export function useBalanceQuery(userEmail?: string) {
  const repository = useDashboardRepository();

  return useQuery({
    queryKey: ["balance", userEmail],
    queryFn: async () => {
      // Esperar un momento para asegurar que el usuario esté completamente cargado
      await new Promise((resolve) => setTimeout(resolve, 8000));
      return repository.getBalance(userEmail);
    },
    enabled: !!userEmail,
    staleTime: STALE_30M,
    gcTime: GC_24H,
    retry: 1,
    refetchOnWindowFocus: false,
    retryDelay: 8000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    networkMode: "offlineFirst",
  });
}

export function useMovementsQuery(userEmail?: string) {
  const repository = useDashboardRepository();

  return useQuery({
    queryKey: ["movements", userEmail],
    queryFn: () => repository.getMovements(userEmail),
    enabled: !!userEmail,
    staleTime: STALE_30M,
    gcTime: GC_24H,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    networkMode: "offlineFirst",
  });
}

export function usePendingWithdrawalsQuery(userEmail?: string) {
  const repository = useDashboardRepository();

  return useQuery({
    queryKey: ["pendingWithdrawals", userEmail],
    queryFn: () => repository.getPendingWithdrawals(userEmail),
    enabled: !!userEmail,
    staleTime: STALE_30M,
    gcTime: GC_24H,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    networkMode: "offlineFirst",
  });
}