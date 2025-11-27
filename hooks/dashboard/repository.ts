
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"

export type BalanceDTO = { balance: number; source: string, lastUpdated?: Date }
export type TransactionDTO = any
export type WithdrawalDTO = any

// REPOSITORY
// Handles all data fetching for dashboard (balance, movements, withdrawals)
export const createDashboardRepository = (authenticatedFetch: any) => ({
  
  async getBalance(userEmail?: string): Promise<BalanceDTO> {
    if (!userEmail) throw new Error("Usuario no autenticado")

    const response = await authenticatedFetch("/api/balance", { method: "POST" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Error al cargar el balance")

    return {
      balance: Number.parseFloat(data.balance),
      source: data.source,
       lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : undefined,
    }
  },

  async getMovements(userEmail?: string): Promise<TransactionDTO[]> {
    if (!userEmail) throw new Error("Usuario no autenticado")

    const response = await authenticatedFetch("/api/transactions", { method: "POST" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Error al cargar movimientos")

    return Array.isArray(data.data) ? data.data : []
  },

  async getPendingWithdrawals(userEmail?: string): Promise<WithdrawalDTO[]> {
    if (!userEmail) throw new Error("Usuario no autenticado")

    const response = await authenticatedFetch("/api/withdrawals/pending?status=pending", { method: "GET" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Error al cargar retiros pendientes")

    return data.ok ? (data.data || []) : []
  },
})

// Hook para usar el repository con authenticatedFetch
export const useDashboardRepository = () => {
  const { authenticatedFetch } = useAuthenticatedFetch()
  return createDashboardRepository(authenticatedFetch)
}

// QUERIES USING REACT QUERY
