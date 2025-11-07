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
import { useCriptoYaExchangeRateQuery } from "@/hooks/external";
import { useIsBolivianQuery } from "@/hooks/deposits/queries";
import { MovementsTable } from "@/components/MovementsTable";
import { PendingWithdrawalsTable } from "@/components/PendingWithdrawalsTable";
import { BalanceCard } from "@/components/BalanceCard";
import ExchangeRate from "@/components/ExchangeRate";

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
  const {
    data: exchangeRateData,
    isLoading: isLoadingExchangeRate,
    isError: isErrorExchangeRate,
    error: exchangeRateError,
    refetch: refetchExchangeRate,
  } = useCriptoYaExchangeRateQuery("USDT", "BOB", 25000);

  // Verificar si el usuario es boliviano
  const { data: isBolivian, isLoading: isLoadingBolivian } = useIsBolivianQuery(user?.email);

  // Función para actualizar todos los datos
  const refreshAllData = async () => {
    await Promise.all([
      refetchBalance(),
      refetchMovements(),
      refetchWithdrawals(),
      refetchExchangeRate(),
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
              isLoadingBalance || isLoadingMovements || isLoadingWithdrawals || isLoadingExchangeRate
            }
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoadingBalance || isLoadingMovements || isLoadingWithdrawals || isLoadingExchangeRate
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

      {/* Exchange Rate - Solo para usuarios bolivianos */}
      {isBolivian && (
        <ExchangeRate 
          data={exchangeRateData}
          isLoading={isLoadingExchangeRate}
          error={isErrorExchangeRate ? exchangeRateError : null}
        />
      )}

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
