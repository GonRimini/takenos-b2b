import { type NextRequest, NextResponse } from "next/server"
import { handleApiError, logError, validateEnvironment, ValidationError, ApiError } from "@/lib/error-handler"

const BLINDPAY_API_BASE = "https://api.blindpay.com/v1"
const INSTANCE_ID = "in_QLygoDC4zomg"

export async function GET(request: NextRequest, { params }: { params: { receiverId: string } }) {
  try {
    validateEnvironment()

    const { receiverId } = params

    if (!receiverId) {
      throw new ValidationError("Receiver ID is required", "receiverId")
    }

    const BLINDPAY_API_KEY = process.env.BLINDPAY_API_KEY!

    const apiUrl = `${BLINDPAY_API_BASE}/instances/${INSTANCE_ID}/receivers/${receiverId}/virtual-accounts`
    console.log("[v0] Making request to:", apiUrl)
    console.log("[v0] Receiver ID:", receiverId)
    console.log("[v0] API Key present:", !!BLINDPAY_API_KEY)
    console.log("[v0] API Key length:", BLINDPAY_API_KEY?.length || 0)
    console.log("[v0] API Key first 10 chars:", BLINDPAY_API_KEY?.substring(0, 10))
    console.log("[v0] API Key last 10 chars:", BLINDPAY_API_KEY?.substring(BLINDPAY_API_KEY.length - 10))
    console.log("[v0] API Key contains Bearer:", BLINDPAY_API_KEY?.includes("Bearer"))

    const authHeader = BLINDPAY_API_KEY.startsWith("Bearer ") ? BLINDPAY_API_KEY : `Bearer ${BLINDPAY_API_KEY}`

    console.log("[v0] Final auth header:", authHeader.substring(0, 20) + "...")

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response statusText:", response.statusText)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.log("[v0] Error response body:", errorText)
      logError(`Blindpay API error: ${response.status} ${response.statusText} - ${errorText}`, "virtual-accounts-api")

      if (response.status === 401) {
        return NextResponse.json({ error: "API authentication failed" }, { status: 500 })
      }

      return NextResponse.json({ error: "Failed to fetch virtual account from Blindpay" }, { status: response.status })
    }

    const responseText = await response.text()
    console.log("[v0] Raw response text:", responseText)
    console.log("[v0] Response text length:", responseText.length)

    let virtualAccountData
    try {
      virtualAccountData = JSON.parse(responseText)
    } catch (parseError) {
      console.log("[v0] JSON parse error:", parseError)
      logError("Failed to parse JSON response from Blindpay", "virtual-accounts-api")
      return NextResponse.json({ error: "Invalid JSON response from API" }, { status: 500 })
    }

    console.log("[v0] Parsed JSON response:", JSON.stringify(virtualAccountData, null, 2))
    console.log("[v0] virtualAccountData.id exists:", !!virtualAccountData?.id)
    console.log("[v0] virtualAccountData.us exists:", !!virtualAccountData?.us)
    console.log("[v0] virtualAccountData structure:", virtualAccountData ? Object.keys(virtualAccountData) : "N/A")

    if (virtualAccountData === null) {
      console.log("[v0] API returned null - receiver has no virtual accounts configured")
      return NextResponse.json(
        {
          error: "No virtual accounts found",
          message: "This receiver does not have virtual accounts configured in Blindpay",
          receiverId,
        },
        { status: 404 },
      )
    }

    if (!virtualAccountData?.id || !virtualAccountData?.us) {
      logError("Unexpected response format from Blindpay virtual accounts API", "virtual-accounts-api")
      console.log(
        "[v0] Full response structure:",
        virtualAccountData ? Object.keys(virtualAccountData) : "null response",
      )
      return NextResponse.json(
        {
          error: "Invalid response format",
          message: "Expected id and us objects not found in API response",
          receiverId,
        },
        { status: 500 },
      )
    }

    console.log("[v0] US data structure:", Object.keys(virtualAccountData.us))

    const transformedData = {
      id: virtualAccountData.id,
      token: virtualAccountData.token,
      blockchain_wallet_id: virtualAccountData.blockchain_wallet_id,
      us: {
        ach: virtualAccountData.us.ach,
        wire: virtualAccountData.us.wire,
        rtp: virtualAccountData.us.rtp,
        swift_bic_code: virtualAccountData.us.swift_bic_code,
        beneficiary: virtualAccountData.us.beneficiary,
        receiving_bank: virtualAccountData.us.receiving_bank,
        account_type: virtualAccountData.us.account_type,
      },
    }

    console.log("[v0] Transformed data:", JSON.stringify(transformedData, null, 2))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.log("[v0] Caught error:", error)
    console.log("[v0] Error type:", typeof error)
    console.log("[v0] Error constructor:", error?.constructor?.name)
    logError(error, "virtual-accounts-api")
    const apiError = handleApiError(error)

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: apiError.message, field: error.field }, { status: 400 })
    }

    if (error instanceof ApiError && error.code === "MISSING_ENV_VARS") {
      return NextResponse.json(
        {
          error: "Configuration Error",
          message:
            "The BLINDPAY_API_KEY environment variable is not configured. Please add it in your Vercel project settings.",
          code: "MISSING_ENV_VARS",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: apiError.status })
  }
}
