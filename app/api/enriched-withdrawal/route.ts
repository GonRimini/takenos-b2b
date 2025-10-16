import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware"

export async function POST(req: NextRequest) {
  try {
    // 🔐 Validar autenticación
    const { email: userEmail, error: authError } = await getAuthenticatedUserEmail(req)
    if (authError || !userEmail) {
      return NextResponse.json(
        { ok: false, error: authError || "Authentication required" },
        { status: 401 }
      )
    }

    // 📥 Parsear body
    const body = await req.json()
    const { withdrawalId } = body || {}

    if (!withdrawalId) {
      return NextResponse.json(
        { ok: false, error: "Missing parameter: withdrawalId" },
        { status: 400 }
      )
    }

    // 🔧 Variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase environment variables missing" },
        { status: 500 }
      )
    }

    // 🚀 Llamada al RPC
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_enriched_withdrawal`
    const payload = {
      p_user_email: userEmail.trim().toLowerCase(),
      p_withdraw_id: withdrawalId,
    }

    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "params=single-object",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const data = await resp.json()

    if (!resp.ok) {
      const errorMessage = data?.message || data?.error || "RPC call failed"
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    console.error("❌ Error en /api/enriched-withdrawal:", e)
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    )
  }
}