import { type NextRequest, NextResponse } from "next/server"
import { handleApiError, logError, validateEnvironment, ValidationError, ApiError } from "@/lib/error-handler"

const BLINDPAY_API_BASE = "https://api.blindpay.com/v1"
const INSTANCE_ID = "in_QLygoDC4zomg"

export async function GET(request: NextRequest) {
  try {
    validateEnvironment()

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      throw new ValidationError("Email parameter is required", "email")
    }

    if (!email.includes("@")) {
      throw new ValidationError("Invalid email format", "email")
    }

    const BLINDPAY_API_KEY = process.env.BLINDPAY_API_KEY!

    const response = await fetch(`${BLINDPAY_API_BASE}/instances/${INSTANCE_ID}/receivers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${BLINDPAY_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      logError(`Blindpay API error: ${response.status} ${response.statusText} - ${errorText}`, "receivers-api")

      if (response.status === 401) {
        return NextResponse.json({ error: "API authentication failed" }, { status: 500 })
      }

      return NextResponse.json({ error: "Failed to fetch receivers from Blindpay" }, { status: response.status })
    }

    const receivers = await response.json()

    console.log("[v0] Blindpay API Response Status:", response.status)
    console.log("[v0] Raw receivers response:", JSON.stringify(receivers, null, 2))
    console.log("[v0] Receivers count:", Array.isArray(receivers) ? receivers.length : "Not an array")

    if (Array.isArray(receivers)) {
      console.log("[v0] All receiver IDs and labels:")
      receivers.forEach((receiver: any, index: number) => {
        console.log(`[v0] Receiver ${index + 1}:`, {
          id: receiver.id,
          value: receiver.value,
          label: receiver.label,
          email: receiver.email,
          name: receiver.name,
        })
      })
    }

    console.log("[v0] Looking for email:", email)

    if (!Array.isArray(receivers)) {
      logError("Unexpected response format from Blindpay receivers API", "receivers-api")
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 })
    }

    const userReceiver = receivers.find((receiver: any) => receiver.email === email)

    console.log("[v0] Found matching receiver:", userReceiver ? JSON.stringify(userReceiver, null, 2) : "None")

    if (!userReceiver) {
      const availableEmails = receivers
        .map((r: any) => r.email)
        .filter(Boolean)
        .slice(0, 10) // Show first 10 emails to avoid huge responses

      console.log("[v0] No receiver found. Available emails (first 10):", availableEmails)

      return NextResponse.json(
        {
          error: "No receiver found for this email",
          searchedEmail: email,
          availableEmails: availableEmails,
          totalReceivers: receivers.length,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      receiverId: userReceiver.id,
      email: userReceiver.email,
    })
  } catch (error) {
    logError(error, "receivers-api")
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
