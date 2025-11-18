import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";

type WithdrawalRail = "ach" | "swift" | "crypto" | "local";

interface CreateWithdrawalRequestBody {
  external_account_id: string;
  currency_code: string;
  rail: WithdrawalRail;
  initial_amount: number;
  external_reference?: string | null;
  file_url?: string | null;
}

export async function POST(req: NextRequest) {
  const sb = supabaseServer();

  try {
    // 🔐 Autenticación
    const {
      id: authUserId,
      email: userEmail,
      error: authError,
    } = await getAuthenticatedUserEmail(req);

    if (authError || !authUserId) {
      return NextResponse.json(
        { ok: false, error: authError || "Authentication required" },
        { status: 401 }
      );
    }

    // 📥 Body
    const body = (await req.json()) as Partial<CreateWithdrawalRequestBody>;
    const {
      external_account_id,
      currency_code,
      rail,
      initial_amount,
      external_reference,
      file_url,
    } = body;

    // ✅ Validaciones básicas
    if (!external_account_id || !currency_code || !rail || initial_amount == null) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing required fields: external_account_id, currency_code, rail, initial_amount",
        },
        { status: 400 }
      );
    }

    if (!["ach", "swift", "crypto", "local"].includes(rail)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid rail. Must be one of: ach, swift, crypto, local",
        },
        { status: 400 }
      );
    }

    // 🚀 Llamar RPC create_withdrawal_request
    const { data, error } = await sb.rpc("create_withdrawal_request", {
      p_user_id: authUserId,
      p_external_account_id: external_account_id,
      p_currency_code: currency_code,
      p_rail: rail,
      p_initial_amount: initial_amount,
      p_external_reference: external_reference ?? null,
      p_file_url: file_url ?? null,
    });

    if (error) {
      console.error("❌ Error calling create_withdrawal_request:", error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Could not create withdrawal request",
        },
        { status: 500 }
      );
    }

    // data es el jsonb que devuelve la función: { ok: true, withdrawal_request_id: ... }
    if (!data || typeof data !== "object" || !("ok" in data)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid response from create_withdrawal_request",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: (data as any).ok === true,
        data,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("❌ Unexpected error in POST /api/withdrawal-requests:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}