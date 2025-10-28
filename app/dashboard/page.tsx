"use client";


import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth";
import { useCompanyName } from "@/hooks/use-company-name";
import {
  useBalanceQuery,
  useMovementsQuery,
  usePendingWithdrawalsQuery,
} from "@/hooks/dashboard/queries";
import { MovementsTable } from "@/components/MovementsTable";
import { PendingWithdrawalsTable } from "@/components/PendingWithdrawalsTable";
import { BalanceCard } from "@/components/BalanceCard";

export default function Dashboard() {
  const { user } = useAuth();
  const { companyName, loading: companyLoading } = useCompanyName();

  const {
    data: balanceData,
    refetch: refetchBalance,
    isLoading: isLoadingBalance,
    isError: isErrorBalance,
  } = useBalanceQuery(user?.email);
  const {
    data: movementsData,
    isLoading: isLoadingMovements,
    refetch: refetchMovements,
  } = useMovementsQuery(user?.email);
  const {
    data: pendingWithdrawalsData,
    isLoading: isLoadingWithdrawals,
    refetch: refetchWithdrawals,
  } = usePendingWithdrawalsQuery(user?.email);

  // Función para actualizar todos los datos
  const refreshAllData = async () => {
    await Promise.all([
      refetchBalance(),
      refetchMovements(),
      refetchWithdrawals(),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola,{" "}
            {companyLoading ? (
              <span className="inline-flex items-center">
                <span className="animate-pulse">Cargando...</span>
              </span>
            ) : (
              companyName || user?.email
            )}
          </h1>
          <p className="text-gray-600 mt-1">Resumen general de tu cuenta</p>
        </div>

        {/* Controles de actualización */}
        <div className="flex items-center space-x-2">
          <Button
            variant="cta"
            size="sm"
            onClick={refreshAllData}
            disabled={
              isLoadingBalance || isLoadingMovements || isLoadingWithdrawals
            }
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoadingBalance || isLoadingMovements || isLoadingWithdrawals
                  ? "animate-spin"
                  : ""
              }`}
            />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Balance Card */}
      <BalanceCard 
        balanceData={balanceData}
        isLoadingBalance={isLoadingBalance}
        isErrorBalance={isErrorBalance}
      />

      {/* Movements Table */}
      <MovementsTable 
        movementsData={movementsData}
        isLoadingMovements={isLoadingMovements}
        userEmail={user?.email}
      />

      {/* Pending Withdrawals Table */}
      <PendingWithdrawalsTable 
        pendingWithdrawalsData={pendingWithdrawalsData}
        isLoadingWithdrawals={isLoadingWithdrawals}
      />
    </div>
  );
}
