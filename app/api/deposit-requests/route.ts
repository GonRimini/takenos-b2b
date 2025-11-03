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
    const { formData } = body || {}

    if (!formData) {
      return NextResponse.json(
        { ok: false, error: "Missing parameter: formData" },
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
    // 📝 Preparar datos para insertar
    // Asegurar que user_email esté presente (usar el del body o el autenticado)
    const insertData = {
      ...formData,
      user_email: body.userEmail || userEmail,
    }

    console.log(insertData)

    // 🗄️ Insertar en deposit_requests
    const url = `${supabaseUrl}/rest/v1/deposits_request`
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(insertData),
      cache: "no-store",
    })

    const data = await resp.json()

    if (!resp.ok) {
      const errorMessage = data?.message || data?.error || "Failed to insert deposit request"
      console.error("❌ Error insertando deposit_requests:", errorMessage)
      return NextResponse.json(
        { ok: false, error: errorMessage },
        { status: 500 }
      )
    }

    console.log("✅ Deposit request insertado:", data)

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    console.error("❌ Error en /api/deposit-requests:", e)
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    )
  }
}

