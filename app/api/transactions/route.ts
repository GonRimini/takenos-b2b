import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware"
import { supabaseServer } from "@/lib/supabase-server"

export const runtime = "nodejs"

type RawTx = {
  id_unico?: string
  fecha: string
  tipo: "deposit" | "withdrawal" | string
  cuenta_origen_o_destino: string
  direccion: "in" | "out" | string
  estado: "processed" | "pending" | "failed" | string
  monto_usd: string
  monto_inicial?: number
  monto_final?: number
  moneda?: string
  tasa_conversion?: number
}

type UiTx = {
  id: string
  date: string        // ISO
  description: string
  amount: number      // + credit / - debit
  type: "credit" | "debit"
  status: "completed" | "pending" | "failed" | "cancelled" | "awaiting"
  raw_id?: string
  direction?: string
  raw_type?: string
  account_ref?: string | null
  initial_amount?: number
  final_amount?: number
  currency?: string
  conversion_rate?: number
}

function toUi(tx: RawTx, idx: number): UiTx {
  // Signo del monto: entrada = positivo / salida = negativo
  const isCredit = tx.direccion === "in"
  const amountAbs = parseFloat(tx.monto_usd)
  const amount = isNaN(amountAbs) ? 0 : (isCredit ? amountAbs : -amountAbs)

  // Normalización del estado
  const status = (() => {
    switch (tx.estado) {
      case "processed":
      case "completed":
        return "completed"
      case "failed":
      case "declined":
      case "rejected":
        return "failed"
      case "cancelled":
      case "canceled":
        return "cancelled"
      case "awaitingPayment":
        return "awaiting"
      default:
        return "pending"
    }
  })()

  // Base de descripción (tipo legible)
  const descBase =
    tx.tipo === "deposit"
      ? "Depósito"
      : tx.tipo === "withdrawal"
      ? "Retiro"
      : tx.tipo

  // Nombre o referencia adicional
  const via = tx.cuenta_origen_o_destino || ""
  const description = via ? `${descBase} ${via}` : descBase

  console.log("Procesando transacción:", {
    id: tx.id_unico || `tx_${idx}_${tx.fecha}`, // mantiene el id real de Retool
    raw_id: tx.id_unico, // para merge con Supabase (withdraw_id)
    date: tx.fecha,
    description,
    amount,
    type: isCredit ? "credit" : "debit",
    status,
    direction: tx.direccion,
    raw_type: tx.tipo, // conserva el tipo original (withdrawal, deposit, etc.)
    account_ref: tx.cuenta_origen_o_destino || null,
    initial_amount: tx.monto_inicial,
    final_amount: tx.monto_final,
    currency: tx.moneda,
    conversion_rate: tx.tasa_conversion,

  })

  // ✅ Estructura final lista para el front y para el merge posterior
  return {
    id: tx.id_unico || `tx_${idx}_${tx.fecha}`, // mantiene el id real de Retool
    raw_id: tx.id_unico, // para merge con Supabase (withdraw_id)
    date: tx.fecha,
    description,
    amount,
    type: isCredit ? "credit" : "debit",
    status,
    direction: tx.direccion,
    raw_type: tx.tipo, // conserva el tipo original (withdrawal, deposit, etc.)
    account_ref: tx.cuenta_origen_o_destino || null,
    initial_amount: tx.monto_inicial,
    final_amount: tx.monto_final,
    currency: tx.moneda,
    conversion_rate: tx.tasa_conversion,
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔐 Validar autenticación y obtener email + id
    const { email: userEmail, id: userId, error: authError } =
      await getAuthenticatedUserEmail(request);

    if (authError || !userEmail || !userId) {
      return NextResponse.json(
        { error: authError || "Authentication required" },
        { status: 401 }
      );
    }

    // Normalizar email
    const normalizedEmail = userEmail.toLowerCase().trim();

    // 🧬 Buscar perfil + company para ver si tiene retool_lookup_email
    const sb = supabaseServer();
    const { data: profile, error: profileError } = await sb
      .from("users")
      .select("*, company:companies(*)")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Error fetching user profile in /api/movements:", profileError);
    }

    // Si la company tiene retool_lookup_email, usar ese; si no, el mail del user
    const emailForRetool = profile?.company?.retool_lookup_email
      ? profile.company.retool_lookup_email.toLowerCase().trim()
      : normalizedEmail;

    console.log("[movements] User email:", normalizedEmail);
    console.log("[movements] Company retool email:", profile?.company?.retool_lookup_email);
    console.log("[movements] Email used for Retool:", emailForRetool);

    const key = process.env.RETOOL_TRANSACTIONS_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // 🚀 Llamada al workflow de Retool (transactions)
    const ret = await fetch(
      "https://api.retool.com/v1/workflows/66b584b5-0907-4d98-80eb-628448a43c1c/startTrigger?environment=production",
      {
        method: "POST",
        headers: {
          "X-Workflow-Api-Key": key.trim(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ userEmail: emailForRetool }),
        cache: "no-store",
      }
    );

    if (!ret.ok) {
      const msg = await ret.text();
      return NextResponse.json(
        { error: `Retool error ${ret.status}: ${msg}` },
        { status: ret.status }
      );
    }

    const payload = await ret.json();

    // Los datos vienen en payload.data
    const raw: RawTx[] = Array.isArray(payload?.data) ? payload.data : [];
    console.log("[movements] Raw transactions data:", JSON.stringify(payload?.data, null, 2));
    console.log(
      "[movements] Raw transactions structure:",
      raw.length > 0 ? Object.keys(raw[0]) : "No transactions"
    );

    const ui: UiTx[] = raw.map(toUi);

    return NextResponse.json({
      email: emailForRetool,
      data: ui,
    });
  } catch (e) {
    console.error("❌ Internal error in /api/movements:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
