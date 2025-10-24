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
    const { depositId } = body || {}

    if (!depositId) {
      return NextResponse.json(
        { ok: false, error: "Missing parameter: depositId" },
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

    // 🔍 Consultar depósito por external_id
    const url = `${supabaseUrl}/rest/v1/deposits?external_id=eq.${depositId}&select=file_url`
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    })

    const data = await resp.json()

    console.log(data)

    if (!resp.ok) {
      const errorMessage = data?.message || data?.error || "Failed to fetch deposit"
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 })
    }

    // 🧾 Validar resultado
    if (!data?.length || !data[0]?.file_url) {
      return NextResponse.json(
        { ok: false, error: "Deposit not found or missing file_url" },
        { status: 404 }
      )
    }

    const fileUrl = data[0].file_url

    return NextResponse.json({ ok: true, file_url: fileUrl })
  } catch (e: any) {
    console.error("❌ Error en /api/deposits/file-url:", e)
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    )
  }
}