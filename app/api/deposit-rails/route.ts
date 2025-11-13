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
        { ok: false, error: "Authentication First Paper" },
        { status: 401 }
      );
    }

    // 📥 Parsear body
    const body = await req.json().catch(() => ({}));
    const { method } = body as { method?: DepositMethod };

    if (!method) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing parameter: method (ACH | SWIFT | LOCAL | CRYPTO)",
        },
        { status: 400 }
      );
    }

    // 👤 Buscar usuario por ID y obtener company_id
    const { data: user, error: userError } = await sb
      .from("users")
      .select("id, company_id")
      .eq("id", authUserId)
      .single();

    console.log("USER FETCHED:", user);

    if (userError) {
      console.error(
        "❌ Error fetching user in /api/funding-accounts:",
        userError
      );
      return NextResponse.json(
        { ok: false, error: "Could not load user" },
        { status: 500 }
      );
    }

    if (!user?.company_id) {
      return NextResponse.json(
        { ok: false, error: "User does not have an associated company" },
        { status: 400 }
      );
    }

    const companyId = user.company_id as string;

    // 🧠 Armar select según el método (rail)
    let selectClause =
      "id, rail, currency_code, nickname, beneficiary_name, beneficiary_bank, status";

    switch (method) {
      case "ach":
        selectClause += `,
          ach:ach_accounts(
          id,
            account_number,
            routing_number,
            receiver_bank,
            beneficiary_bank_address
          )
        `;
        break;

      case "swift":
        selectClause += `,
          swift:swift_accounts(
          id,
            swift_bic,
            account_number,
            receiver_bank,
            beneficiary_bank_address
          )
        `;
        break;

      case "crypto":
        selectClause += `,
          crypto:crypto_accounts(
            id,
            wallet_address,
            wallet_network
          )
        `;
        break;

      case "local":
        selectClause += `,
          local:local_accounts(
            id,
            cbu,
            alias,
            bank_name,
            account_holder
          )
        `;
        break;
    }

    const { data: accounts, error: accountsError } = await sb
      .from("accounts")
      .select(selectClause)
      .eq("company_id", companyId)
      .eq("rail", method)
    //   .eq("status", "ACTIVE");

    console.log("ACCOUNTS FETCHED:", accounts?.[0] ? (accounts[0] as any)?.swift : undefined);

    if (accountsError) {
      console.error("❌ Error fetching funding accounts:", accountsError);
      return NextResponse.json(
        { ok: false, error: "Could not load funding accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: accounts ?? [],
    });
  } catch (e: any) {
    console.error("❌ Unexpected error in /api/funding-accounts:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
