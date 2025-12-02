import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const sb = supabaseServer();

  try {
    // 🔐 Validar autenticación
    const {
      email: userEmail,
      id: authUserId,
      error: authError,
    } = await getAuthenticatedUserEmail(req);

    if (authError || !userEmail || !authUserId) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 📥 Parsear body
    const body = await req.json();
    const { nickname, currency_code, rail, is_default, status, beneficiary_url } = body;

    // ✅ Validaciones básicas
    if (!nickname || !currency_code || !rail || !beneficiary_url) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: nickname, currency_code, rail, beneficiary_url",
        },
        { status: 400 }
      );
    }

    if (!["ach", "swift", "crypto", "local"].includes(rail)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid rail. Must be: ach, swift, crypto, or local",
        },
        { status: 400 }
      );
    }

    // Extraer datos específicos del rail
    // Esperamos algo como { ach: {...} } o { swift: {...} } según rail
    const railData = body[rail as keyof typeof body];

    if (!railData || typeof railData !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing or invalid data for rail "${rail}"`,
        },
        { status: 400 }
      );
    }

    console.log("Creating external account with rail data:", railData);

    // 🚀 Llamar a la RPC para crear la cuenta
    const { data, error } = await sb.rpc("create_external_account", {
      p_user_id: authUserId,
      p_rail: rail,
      p_currency_code: currency_code,
      p_nickname: nickname,
      p_details: railData, // 👈 este tiene que matchear el parámetro jsonb de la RPC
      p_is_default: is_default ?? false,
      p_status: status ?? "active",
      p_beneficiary_url: beneficiary_url,
    });

    if (error) {
      console.error("❌ Error calling create_external_account RPC:", error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Could not create external account",
        },
        { status: 500 }
      );
    }

    // La RPC devuelve directamente un UUID (external_accounts.id)
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "RPC returned no data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        external_account_id: data,
      },
    });
  } catch (e: any) {
    console.error("❌ Unexpected error in POST /api/external-accounts:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const sb = supabaseServer();

  try {
    // 🔐 Validar autenticación
    const {
      email: userEmail,
      id: authUserId,
      error: authError,
    } = await getAuthenticatedUserEmail(req);

    if (authError || !userEmail || !authUserId) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 📥 Obtener parámetros de query (para filtrar por rail si llega)
    const { searchParams } = new URL(req.url);
    const rail = searchParams.get("rail");

    // 🚀 Llamar a la RPC simple (ya resuelve company_id adentro)
    const { data, error } = await sb.rpc("get_company_external_accounts", {
      p_user_id: authUserId,
    });

    if (error) {
      console.error("❌ Error calling get_company_external_accounts RPC:", error);
      return NextResponse.json(
        { ok: false, error: "Could not load external accounts" },
        { status: 500 }
      );
    }

    const accounts = Array.isArray(data) ? data : [];

    // 🔍 Filtrar por rail en memoria si viene en la query (?rail=ach, etc.)
    const filteredAccounts = rail
      ? accounts.filter((acc: any) => acc.rail === rail)
      : accounts;

    return NextResponse.json({
      ok: true,
      data: filteredAccounts,
    });
  } catch (e: any) {
    console.error("❌ Unexpected error in GET /api/external-accounts:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
