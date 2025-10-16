import { useEnrichedWithdrawals } from "@/lib/supabase-helper"
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"

export const useMovementsFetcher = (user: any, companyName?: string) => {
  const { authenticatedFetch } = useAuthenticatedFetch()
  const { fetchEnrichedWithdrawals } = useEnrichedWithdrawals()

  const fetchMovementsData = async (): Promise<any[]> => {
    if (!user?.email) throw new Error("Usuario no autenticado")

    // 1️⃣ Traer las transacciones crudas (como ya hacías)
    const response = await authenticatedFetch("/api/transactions", {
      method: "POST",
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Error al cargar movimientos")

    const transactions = Array.isArray(data.data) ? data.data : []
    if (transactions.length === 0) return []

    // 2️⃣ Añadir info de contexto
    transactions.companyName = companyName
    transactions.userEmail = user.email

    // 3️⃣ Filtrar solo los retiros
    const withdrawalIds = transactions
      .filter((tx:any) => tx.tipo === "withdrawal")
      .map((tx:any) => tx.id_unico)

    if (withdrawalIds.length === 0) return transactions

    // 4️⃣ Llamar a la RPC en Supabase
    const enrichedWithdrawals = await fetchEnrichedWithdrawals(user.email, withdrawalIds)
      console.log("📚 [fetchMovementsData] Data RPC enriquecida:", enrichedWithdrawals)


    // 5️⃣ Mergear la data enriquecida
    const enrichedMap = new Map(enrichedWithdrawals.map((e: any) => [e.withdraw_id, e]))
    const merged = transactions.map((tx:any) => {
      if (tx.tipo !== "withdrawal") return tx
      const extra:any = enrichedMap.get(tx.id_unico)
      return extra
        ? {
            ...tx,
            nickname: extra.nickname,
            method: extra.method,
            category: extra.category,
            beneficiary_name: extra.beneficiary_name,
            beneficiary_bank: extra.beneficiary_bank,
            account_number: extra.account_number,
            wallet_address: extra.wallet_address,
            wallet_network: extra.wallet_network,
          }
        : tx
    })
  console.log("✅ [fetchMovementsData] Data final enriquecida:", merged)
    return merged
  }

  return { fetchMovementsData }
}