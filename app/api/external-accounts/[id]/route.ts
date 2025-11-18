import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const sb = supabaseServer();

  try {
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

    const externalAccountId = context.params.id;

    if (!externalAccountId) {
      return NextResponse.json(
        { ok: false, error: "Missing parameter: external account id" },
        { status: 400 }
      );
    }

    // 🚀 Llamar RPC get_external_account_by_id
    const { data, error } = await sb.rpc("get_external_account_by_id", {
      p_user_id: authUserId,
      p_external_account_id: externalAccountId,
    });

    if (error) {
      console.error("❌ Error calling get_external_account_by_id:", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Could not load external account" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "External account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (e: any) {
    console.error("❌ Unexpected error in GET /api/external-accounts/[id]:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}