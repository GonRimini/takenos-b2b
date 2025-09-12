import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware"

export async function POST(req: NextRequest) {
  try {
    // Validar autenticación y obtener email del token
    const { email: userEmail, error: authError } = await getAuthenticatedUserEmail(req)
    
    if (authError || !userEmail) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 })
    }

    const body = await req.json()
    const { category, method = null, nickname = null, details } = body || {}

    if (!category) {
      return NextResponse.json({ ok: false, error: "Faltan campos requeridos (category)" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: "Faltan variables de entorno de Supabase" }, { status: 500 })
    }

    const apiUrl = `${supabaseUrl}/rest/v1/payout_accounts`
    const payload = {
      user_email: userEmail,
      category,
      method,
      nickname,
      details: details || {},
      is_default: false,
    }

    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const data = await resp.json()

    if (!resp.ok) {
      const errorMessage = data?.message || data?.error || "Error al insertar en Supabase"
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 })
    }

    const inserted = Array.isArray(data) ? data[0] : data
    return NextResponse.json({ ok: true, id: inserted?.id ?? null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error inesperado" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Validar autenticación y obtener email del token
  const { email: userEmail, error: authError } = await getAuthenticatedUserEmail(req)
  
  if (authError || !userEmail) {
    return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE!
  const endpoint = `${url}/rest/v1/payout_accounts?user_email=eq.${encodeURIComponent(
    userEmail
  )}&order=is_default.desc,created_at.desc&select=id,category,method,nickname,last4,beneficiary_bank,wallet_network,local_bank,details`

  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const txt = await res.text()
    return NextResponse.json({ ok: false, error: txt }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ ok: true, data })
}
