import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const qsEmail = sp.get("email")?.toLowerCase().trim();
    const email = qsEmail || req.headers.get("x-user-email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { error: "Falta 'email' (pasalo por query ?email= o header x-user-email)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("deposit_accounts")
      .select("*")
      .eq("user_email", email);

    if (error) {
      console.error("❌ Supabase error (deposit_accounts):", error.message);
      return NextResponse.json(
        { error: "Error consultando cuentas whitelisteadas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data ?? [] }, { status: 200 });
  } catch (err: any) {
    console.error("Unhandled error /api/deposit-accounts:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}


