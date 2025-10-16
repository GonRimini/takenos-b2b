import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"

export const useEnrichedWithdrawals = () => {
  const { authenticatedFetch } = useAuthenticatedFetch()

   const fetchEnrichedWithdrawal = async (withdrawalId: string) => {
    const res = await authenticatedFetch("/api/enriched-withdrawal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Error RPC")

    console.log("✅ [BFF] Enriched data:", json.data)
    return json.data
  }

  return { fetchEnrichedWithdrawal }
}

//   const {authenticatedFetch} = useAuthenticatedFetch()
//   // const { data, error } = await supabase.rpc("get_enriched_withdrawals", {
//   //   user_email: "gonzalo.rimini@gmail.com",
//   //   withdraw_ids: [
//   //     "7d0344aa-d56e-4da0-98e9-20b3efffaf8e",
//   //     "9e246ef0-aab0-4133-9f7d-58066495d2d4",
//   //   ],
//   // })

//       const response = await authenticatedFetch(
//       `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_enriched_withdrawals`,
//       {
//         method: "POST",
//         headers: {
//           apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//         },
//         body: JSON.stringify({
//           user_email: "gonzalo.rimini@gmail.com",
//           withdraw_ids:  [
//       "7d0344aa-d56e-4da0-98e9-20b3efffaf8e",
//       "9e246ef0-aab0-4133-9f7d-58066495d2d4",
//     ],
//         }),
//       }
//     )

//    console.log("✅ RPC Data:", response)
// }