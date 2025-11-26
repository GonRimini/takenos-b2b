import { type NextRequest, NextResponse } from "next/server"
import { logError } from "@/lib/error-handler"
import { balanceCache } from "@/lib/balance-cache"
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware"
import { supabaseServer } from "@/lib/supabase-server"

export const runtime = "nodejs"

function extractBalanceFromRetool(ret: any): string | null {
  try {
    if (!ret) return null
    // Retool can return { data: <number|string|object|array> }
    const payload = (ret as any).data ?? ret

    if (payload == null) return null

    // If payload is already a number or string
    if (typeof payload === "number" || typeof payload === "string") {
      return String(payload)
    }
 
    // If payload is an object
    if (typeof payload === "object") {
      // Array case: [{ balance: 123.45 }]
      if (Array.isArray(payload)) {
        const first = payload[0]
        if (first && typeof first === "object" && "balance" in first) {
          return String((first as any).balance)
        }
        return null
      }

      // Object case: { balance: 123.45 }
      if ("balance" in payload) {
        return String((payload as any).balance)
      }

      // Nested common cases
      if ((payload as any).data) {
        const inner = (payload as any).data
        if (typeof inner === "number" || typeof inner === "string") return String(inner)
        if (Array.isArray(inner) && inner[0] && "balance" in inner[0]) return String(inner[0].balance)
        if (typeof inner === "object" && "balance" in inner) return String(inner.balance)
      }
    }
  } catch (_) {
    // fallthrough to null
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación y obtener email + id
    const { email: userEmail, id: userId, error: authError } = await getAuthenticatedUserEmail(request)

    console.log("Authenticated user email:", userEmail)
    console.log("Authenticated user ID:", userId)
    
    if (authError || !userEmail || !userId) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 })
    }

    // Normalizar email a lowercase para que no sea case sensitive
    const normalizedEmail = userEmail.toLowerCase().trim()

    const sb = supabaseServer()
    const { data: profile } = await sb
      .from("users")
      .select("*, company:companies(*)")
      .eq("id", userId)
      .maybeSingle()

      console.log("User profile data:", profile)

    let emailForRetool = profile?.company?.retool_lookup_email
      ? profile.company.retool_lookup_email.toLowerCase().trim()
      : normalizedEmail

    console.log("RETOOLLL EMAIILLLL", emailForRetool)

    const RETOOL_API_KEY = process.env.RETOOL_API_KEY
    if (!RETOOL_API_KEY) {
      logError("Missing RETOOL_API_KEY environment variable", "balance-api")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const RETOOL_URL = process.env.RETOOL_URL
    if (!RETOOL_URL) {
      logError("Missing RETOOL_URL environment variable", "balance-api")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    console.log("[v0] Fetching balance for user:", emailForRetool)
    console.log("[v0] API key length:", RETOOL_API_KEY.length)
    console.log("[v0] API key first 10 chars:", RETOOL_API_KEY.substring(0, 10))

    const key = RETOOL_API_KEY.trim()
    const requestBody = { userEmail: emailForRetool }
    console.log("[v0] Request body being sent:", JSON.stringify(requestBody))

    const response = await fetch(
      RETOOL_URL,
      {
        method: "POST",
        headers: {
          "X-Workflow-Api-Key": key,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
      },
    )

    console.log("[v0] Retool API response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const msg = await response.text()
      console.log("[v0] Error response body:", msg)
      logError(`Retool API error ${response.status}: ${msg}`, "balance-api")
      return NextResponse.json({ error: "Failed to fetch balance data" }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Retool API response:", JSON.stringify(data, null, 2))

    // Handle error response indicating no balance (treat as $0.00)
    if (data.error === true && data.message && data.message.includes("parsing the JSON body")) {
      console.log("[v0] User has no balance data, setting to $0.00")
      const zeroBalance = "0.00"
      
      // Cache the zero balance (SIN CAMBIOS)
      try {
        balanceCache.set(userEmail, { balance: zeroBalance, timestamp: Date.now() })
        console.log(`[v0] Cached zero balance for ${userEmail}: ${zeroBalance}`)
      } catch (e) {
        console.log("[v0] Could not cache zero balance:", e)
      }

      return NextResponse.json({
        message: "No balance data found, defaulting to $0.00",
        email: userEmail,
        balance: zeroBalance,
        source: "default",
      })
    }

    // NEW: handle direct data payloads from Retool (SIN CAMBIOS en cache)
    const directBalance = extractBalanceFromRetool(data)
    if (directBalance !== null) {
      try {
        balanceCache.set(userEmail, { balance: directBalance, timestamp: Date.now() })
        console.log(`[v0] Cached balance for ${userEmail}: ${directBalance}`)
      } catch (e) {
        console.log("[v0] Could not cache balance:", e)
      }

      return NextResponse.json({
        message: "Balance retrieved from workflow",
        email: userEmail,
        balance: directBalance,
        source: "workflow",
      })
    }

    // Legacy path (SIN CAMBIOS en cache)
    if ((data as any).success && (data as any).workflow_run) {
      console.log("[v0] Workflow triggered successfully, ID:", (data as any).workflow_run.id)
      console.log("[v0] Workflow status:", (data as any).workflow_run.status)

      const cachedBalance = balanceCache.get(normalizedEmail)

      if (cachedBalance) {
        const ageInMinutes = (Date.now() - cachedBalance.timestamp) / (1000 * 60)
        console.log(`[v0] Found cached balance for ${normalizedEmail}: ${cachedBalance.balance} (age: ${ageInMinutes.toFixed(1)} minutes) `)

        if (ageInMinutes < 5) {
          return NextResponse.json({
            message: "Balance retrieved from cache",
            email: userEmail,
            balance: cachedBalance.balance,
            source: "cache",
            cacheAge: `${ageInMinutes.toFixed(1)} minutes`,
          })
        } else {
          console.log(`[v0] Cached balance is too old (${ageInMinutes.toFixed(1)} minutes), returning workflow id for polling`)
        }
      }

      return NextResponse.json({
        message: "Workflow triggered, poll for results",
        email: normalizedEmail,
        workflowId: (data as any).workflow_run.id,
        status: (data as any).workflow_run.status,
        source: "workflow",
      })
    }

    console.log("[v0] Unexpected response format from Retool")
    return NextResponse.json({ error: "Unexpected response format" }, { status: 500 })
  } catch (error) {
    console.log("[v0] Caught error:", error)
    logError(error, "balance-api")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
