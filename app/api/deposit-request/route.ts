import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";
import { supabaseServer } from "@/lib/supabase-server";

type DepositMethod = "ach" | "swift" | "crypto" | "local";

interface CreateDepositRequestBody {
  externalAccountId?: string | null;
  fundingAccountId: string;
  rail: DepositMethod;
  currencyCode: string;
  initialAmount?: number | null;
  externalReference?: string | null;
  externalId?: string | null;
  fileUrl?: string | null;
}

export async function POST(req: NextRequest) {
  const sb = supabaseServer();

  try {
    const { id: authUserId, error: authError } = await getAuthenticatedUserEmail(req);

    if (authError || !authUserId) {
      return NextResponse.json(
        { ok: false, error: authError || "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as CreateDepositRequestBody;

    const {
      externalAccountId,
      fundingAccountId,
      rail,
      currencyCode,
      initialAmount,
      externalReference,
      externalId,
      fileUrl,
    } = body || {};

    if (!fundingAccountId || !rail || !currencyCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: fundingAccountId, rail, currencyCode",
        },
        { status: 400 }
      );
    }

    if (!["ach", "swift", "crypto", "local"].includes(rail)) {
      return NextResponse.json(
        { ok: false, error: "Invalid rail. Must be: ach, swift, crypto, or local" },
        { status: 400 }
      );
    }

    const { data, error } = await sb.rpc("create_deposit_request", {
      p_user_id: authUserId,
      p_external_account_id: externalAccountId ?? null,
      p_funding_account_id: fundingAccountId,
      p_currency_code: currencyCode,
      p_rail: rail,
      p_initial_amount: initialAmount ?? null,
      p_file_url: fileUrl ?? null,
      p_external_reference: externalReference ?? null,
      p_external_id: externalId ?? null,
    });

    if (error) {
      console.error("❌ Error calling create_deposit_request RPC:", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Could not create deposit request" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "RPC returned no data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        deposit_request_id: data,
      },
    });
  } catch (e: any) {
    console.error("❌ Error en /api/deposit-requests:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}