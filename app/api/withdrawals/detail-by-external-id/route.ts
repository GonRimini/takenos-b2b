import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";

export async function POST(req: NextRequest) {
  try {
    // 🔐 Auth
    const { email, error: authError } = await getAuthenticatedUserEmail(req);

    if (authError || !email) {
      return NextResponse.json(
        { ok: false, error: authError || "Authentication required" },
        { status: 401 }
      );
    }

    // 📥 Body
    const body = await req.json().catch(() => ({}));
    const { externalId } = body || {};

    if (!externalId) {
      return NextResponse.json(
        { ok: false, error: "Missing parameter: externalId" },
        { status: 400 }
      );
    }

    const sb = supabaseServer();

    const { data, error } = await sb.rpc(
      "get_withdrawal_request_detail_by_external_id",
      { p_external_id: externalId }
    );

    if (error) {
      console.error(
        "❌ Error calling get_withdrawal_request_detail_by_external_id:",
        error
      );
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Failed to load withdrawal detail",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error(
      "❌ Unexpected error in POST /api/download-transaction/withdrawal:",
      e
    );
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}