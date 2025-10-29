import { useQuery } from "@tanstack/react-query";
import { useDashboardRepository } from "./repository";

export function useBalanceQuery(userEmail?: string) {
  const repository = useDashboardRepository();

  return useQuery({
    queryKey: ["balance", userEmail],
    queryFn: () => repository.getBalance(userEmail),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000, // 2 minutes (más agresivo)
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1, // Solo 1 retry para fallar rápido
    refetchOnWindowFocus: false, // No refetch cuando cambia focus
  });
}

export function useMovementsQuery(userEmail?: string) {
  const repository = useDashboardRepository();

  return useQuery({
    queryKey: ["movements", userEmail],
    queryFn: () => repository.getMovements(userEmail),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePendingWithdrawalsQuery(userEmail?: string) {
  const repository = useDashboardRepository();

  return useQuery({
    queryKey: ["pendingWithdrawals", userEmail],
    queryFn: () => repository.getPendingWithdrawals(userEmail),
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}  
