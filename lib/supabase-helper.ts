import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch"
// import { supabase } from "./supabase-client"

export const useEnrichedWithdrawals = () => {
  const { authenticatedFetch } = useAuthenticatedFetch()

  const fetchEnrichedWithdrawals = async (userEmail: string, withdrawalIds: string[]) => {
    console.log("🚀 [RPC] Llamando get_enriched_withdrawals con:", {
      userEmail,
      withdrawalIds
    })

    const response = await authenticatedFetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_enriched_withdrawals`,
      {
        method: "POST",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          user_email: userEmail,
          withdraw_ids: withdrawalIds,
        }),
      }
    )

    console.log("🛰️ [RPC] Status:", response.status)
    const text = await response.text()
    console.log("🛰️ [RPC] Raw response text:", text)

    try {
      const json = JSON.parse(text)
      console.log("📦 [RPC] Parsed JSON:", json)
      return json
    } catch (e) {
      console.error("❌ [RPC] Error parseando JSON:", e)
      return []
    }
  }

  return { fetchEnrichedWithdrawals }
}

// export async function testRPC() {
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