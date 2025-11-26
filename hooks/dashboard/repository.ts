
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"

export type BalanceDTO = { balance: number; source: string, lastUpdated?: Date }
export type TransactionDTO = any
export type WithdrawalDTO = any

// Helper function para hacer polling del balance
async function pollForBalance(
  authenticatedFetch: any,
  workflowId: string,
  userEmail: string,
  maxAttempts: number = 20,
  delayMs: number = 2000
): Promise<BalanceDTO> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Esperar antes de hacer el poll (excepto en el primer intento)
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }

      const pollResponse = await authenticatedFetch("/api/balance/poll", {
        method: "POST",
        body: JSON.stringify({ workflowId }),
      })

      const pollData = await pollResponse.json()

      if (!pollResponse.ok) {
        // Si es un error de servidor, continuar intentando
        if (pollResponse.status >= 500) {
          console.log(`[Balance] Poll attempt ${attempt + 1} failed, retrying...`)
          continue
        }
        // Si es un error del cliente, lanzar error
        throw new Error(pollData.error || "Error al hacer polling del balance")
      }

      // Si el workflow está completado y tenemos el balance
      if (pollData.status === "COMPLETED") {
        // Si hay un error, lanzarlo
        if (pollData.error) {
          throw new Error(pollData.error)
        }
        // Si tenemos el balance, retornarlo
        if (pollData.balance !== undefined && pollData.balance !== null) {
          return {
            balance: Number.parseFloat(String(pollData.balance)),
            source: "workflow",
            lastUpdated: new Date(),
          }
        }
        // Si no hay balance pero está completado, podría ser un error
        throw new Error("Workflow completado pero no se encontró el balance")
      }

      // Si el workflow falló
      if (pollData.status === "FAILED") {
        throw new Error(pollData.error || "El workflow falló al obtener el balance")
      }

      // Si todavía está pendiente o en progreso, continuar polling
      if (pollData.status === "PENDING" || pollData.status === "IN_PROGRESS") {
        console.log(`[Balance] Workflow ${workflowId} still ${pollData.status}, attempt ${attempt + 1}/${maxAttempts}`)
        continue
      }

      // Si llegamos aquí y no tenemos balance, continuar intentando
      console.log(`[Balance] Poll attempt ${attempt + 1} completed but no balance yet`)
    } catch (error) {
      // Si es el último intento, lanzar el error
      if (attempt === maxAttempts - 1) {
        throw error
      }
      // Si no, continuar intentando
      console.log(`[Balance] Poll attempt ${attempt + 1} error, retrying:`, error)
    }
  }

  // Si llegamos aquí, se agotaron los intentos
  throw new Error("Timeout: No se pudo obtener el balance después de múltiples intentos")
}

// REPOSITORY
// Handles all data fetching for dashboard (balance, movements, withdrawals)
export const createDashboardRepository = (authenticatedFetch: any) => ({
  
  async getBalance(userEmail?: string): Promise<BalanceDTO> {
    if (!userEmail) throw new Error("Usuario no autenticado")

    const response = await authenticatedFetch("/api/balance", { method: "POST" })
    const data = await response.json()
    if (!response.ok) {
      const errorMsg = data.error?.message || data.error || "Error al cargar el balance"
      throw new Error(errorMsg)
    }

    // Si la respuesta tiene un workflowId, necesitamos hacer polling
    if (data.workflowId) {
      return pollForBalance(authenticatedFetch, data.workflowId, userEmail)
    }

    // Si ya tenemos el balance directamente, retornarlo
    if (data.balance !== undefined && data.balance !== null) {
      return {
        balance: Number.parseFloat(String(data.balance)),
        source: data.source || "workflow",
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : undefined,
      }
    }

    // Si no hay balance ni workflowId, es un error
    throw new Error("No se pudo obtener el balance")
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

    const response = await authenticatedFetch("/api/withdrawals/pending", { method: "GET" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Error al cargar retiros pendientes")

    return data.success ? (data.data || []) : []
  },
})

// Hook para usar el repository con authenticatedFetch
export const useDashboardRepository = () => {
  const { authenticatedFetch } = useAuthenticatedFetch()
  return createDashboardRepository(authenticatedFetch)
}

// QUERIES USING REACT QUERY
