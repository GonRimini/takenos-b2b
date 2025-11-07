import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

const TABLE_BY_METHOD = {
  ach: "ach_accounts",
  swift: "swift_accounts",
  wire: "swift_accounts", // alias
  crypto: "crypto_wallets",
  local: "local",
} as const;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const method = sp.get("method")?.toLowerCase().trim();
    const qsEmail = sp.get("email")?.toLocaleLowerCase().trim();
  //const headerEmail = req.headers.get("x-user-email");
    const email = qsEmail; //(qsEmail || headerEmail || "").toLowerCase().trim();

    if (!method || !(method in TABLE_BY_METHOD)) {
      return NextResponse.json(
        { error: "Parámetro inválido: 'method' (ach|swift|crypto|local)" },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { error: "Falta 'email' (pasalo por query ?email= o header x-user-email)" },
        { status: 400 }
      );
    }

    const table = TABLE_BY_METHOD[method as keyof typeof TABLE_BY_METHOD];

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("email", email);

    if (error) {
      console.error(`❌ Supabase error (${table}):`, error.message);
      return NextResponse.json(
        { error: "Error consultando cuentas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      method,
      table,
      data: data ?? [],
    });
  } catch (err: any) {
    console.error("Unhandled error /api/payout-accounts:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
    try {
      const body = await request.json(); // ⚠️ se inserta tal cual viene
  
      const { data, error } = await supabase
        .from("deposit_accounts")
        .insert([body])
        .select()
        .single();
  
      if (error) {
        console.error("❌ Error insertando deposit_accounts:", error.message);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
  
      return NextResponse.json({ ok: true, data }, { status: 201 });
    } catch (err: any) {
      console.error("❌ Error en POST /api/deposit-accounts:", err);
      return NextResponse.json(
        { error: "Error interno del servidor" },
        { status: 500 }
      );
    }
  }
  