import { type NextRequest, NextResponse } from "next/server"
import { logError } from "@/lib/error-handler"
import { balanceCache } from "@/lib/balance-cache"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Webhook received:", JSON.stringify(body, null, 2))

    // Extract user email and balance from webhook payload
    let userEmail: string | null = null
    let balance: string | null = null

    // Try different possible formats
    if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      // Format: {"data":[{"email":"...","balance":"33678.55"}]}
      const firstItem = body.data[0]
      userEmail = firstItem.email
      balance = firstItem.balance
    } else if (body.email && body.balance) {
      // Format: {"email":"...","balance":"33678.55"}
      userEmail = body.email
      balance = body.balance
    } else if (body.userEmail && body.balance) {
      // Format: {"userEmail":"...","balance":"33678.55"}
      userEmail = body.userEmail
      balance = body.balance
    }

    if (!userEmail || !balance) {
      console.log("[v0] Could not extract email or balance from webhook payload")
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    // Store the balance in memory
    balanceCache.set(userEmail, {
      balance,
      timestamp: Date.now()
    })

    console.log(`[v0] Stored balance for ${userEmail}: ${balance}`)

    return NextResponse.json({ 
      success: true, 
      message: "Balance stored successfully",
      userEmail,
      balance 
    })

  } catch (error) {
    console.error("[v0] Webhook error:", error)
    logError(error, "webhook-balance")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Cache is now exported from lib/balance-cache.ts
