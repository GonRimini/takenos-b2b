import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";

export async function GET(req: NextRequest) {
  try {
    const sb = supabaseServer();

    // 🔐 Autenticación - obtener user_id
    const {
      id: authUserId,
      error: authError,
    } = await getAuthenticatedUserEmail(req);

    if (authError || !authUserId) {
      return NextResponse.json(
        { ok: false, error: authError || "Authentication required" },
        { status: 401 }
      );
    }

    // Obtener company_id del usuario
    const { data: userData, error: userError } = await sb
      .from("users")
      .select("company_id")
      .eq("id", authUserId)
      .single();

    if (userError || !userData?.company_id) {
      console.error("❌ Error getting user company_id:", userError);
      return NextResponse.json(
        { ok: false, error: "User company not found" },
        { status: 404 }
      );
    }

    // Leer ?status=pending | approved | rejected | etc
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (!status) {
      return NextResponse.json(
        { ok: false, error: "Status parameter is required" },
        { status: 400 }
      );
    }

    // Llamar al RPC pasando company_id y status
    const { data, error } = await sb.rpc(
      "get_company_withdrawals_by_status",
      {
        p_company_id: userData.company_id,
        p_status: status,
      }
    );

    if (error) {
      console.error(
        "❌ Error calling get_withdrawal_requests_by_status:",
        error
      );
      return NextResponse.json(
        { ok: false, error: error.message || "Failed to load withdrawal requests" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: data ?? [],
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("❌ Error in GET /api/withdrawals/pending:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}