import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware";
import { supabaseServer } from "@/lib/supabase-server";

type DepositMethod = "ach" | "swift" | "local" | "crypto";

export async function POST(req: NextRequest) {
  const sb = supabaseServer();

  try {
    // 🔐 Validar autenticación y obtener userId del token
    const {
      email: userEmail,
      id: authUserId,
      error: authError,
    } = await getAuthenticatedUserEmail(req);

    console.log("AUTH USER EMAIL:", userEmail, authUserId, authError);

    if (authError || !userEmail || !authUserId) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 📥 Body opcional: method (por compatibilidad con el código actual)
    const body = await req.json().catch(() => ({}));

    // 🚀 Llamar a la RPC que trae TODAS las funding accounts de la company
    const { data, error } = await sb.rpc("get_funding_accounts", {
      p_user_id: authUserId,
    });

    if (error) {
      console.error("❌ Error calling get_funding_accounts RPC:", error);
      return NextResponse.json(
        { ok: false, error: "Could not load funding accounts" },
        { status: 500 }
      );
    }

    let accounts = Array.isArray(data) ? data : [];

    console.log("FUNDING ACCOUNTS RESULT:", {
      total: (data as any[])?.length ?? 0,
      returned: accounts.length,
      data: accounts,
    });

    return NextResponse.json({
      ok: true,
      data: accounts, // siempre array, filtrado o completo
    });
  } catch (e: any) {
    console.error("❌ Unexpected error in /api/funding-accounts:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}