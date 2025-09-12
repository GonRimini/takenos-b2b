import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware"

export const runtime = "nodejs"

type RawTx = {
  fecha: string
  tipo: "deposit" | "withdrawal" | string
  cuenta_origen_o_destino: string
  direccion: "in" | "out" | string
  estado: "processed" | "pending" | "failed" | string
  monto_usd: string
}

type UiTx = {
  id: string
  date: string        // ISO
  description: string
  amount: number      // + credit / - debit
  type: "credit" | "debit"
  status: "completed" | "pending" | "failed"
}

function toUi(tx: RawTx, idx: number): UiTx {
  // signo: in => + ; out => -
  const isCredit = tx.direccion === "in"
  const amountAbs = parseFloat(tx.monto_usd)
  const amount = isCredit ? amountAbs : -amountAbs

  // status map
  const status =
    tx.estado === "processed" || tx.estado === "completed" ? "completed" :
    tx.estado === "failed" || tx.estado === "declined" ? "failed" :
    "pending"

  // descripción legible
  const descBase =
    tx.tipo === "deposit" ? "Depósito" :
    tx.tipo === "withdrawal" ? "Retiro" :
    tx.tipo

  const via = tx.cuenta_origen_o_destino || ""
  const description = via ? `${descBase} ${via}` : descBase

  return {
    id: `tx_${idx}_${tx.fecha}`,
    date: tx.fecha,
    description,
    amount,
    type: isCredit ? "credit" : "debit",
    status,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación y obtener email del token
    const { email: userEmail, error: authError } = await getAuthenticatedUserEmail(request)
    
    if (authError || !userEmail) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 })
    }

    // Normalizar email a lowercase para que no sea case sensitive
    const normalizedEmail = userEmail.toLowerCase().trim()

    const key = process.env.RETOOL_TRANSACTIONS_API_KEY
    if (!key) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Llamada al workflow de Retool (usa tu ID)
    const ret = await fetch(
      "https://api.retool.com/v1/workflows/62090e2f-ae2e-4034-8e1d-b1d09d9e81d7/startTrigger?environment=production",
      {
        method: "POST",
        headers: {
          "X-Workflow-Api-Key": key,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ userEmail: normalizedEmail }),
        cache: "no-store",
      }
    )

    if (!ret.ok) {
      const msg = await ret.text()
      return NextResponse.json({ error: `Retool error ${ret.status}: ${msg}` }, { status: ret.status })
    }

    const payload = await ret.json()
    console.log("[v0] Retool transactions response:", JSON.stringify(payload, null, 2))
    
    // Los datos están directamente en data
    const raw: RawTx[] = Array.isArray(payload?.data) ? payload.data : []
    console.log("[v0] Parsed raw transactions:", raw.length)
    console.log("[v0] Raw transactions structure:", raw.length > 0 ? Object.keys(raw[0]) : "No transactions")
    const ui: UiTx[] = raw.map(toUi)
    console.log("[v0] UI transactions generated:", ui.length)

    return NextResponse.json({ email: normalizedEmail, data: ui })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
