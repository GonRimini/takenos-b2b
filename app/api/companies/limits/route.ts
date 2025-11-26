import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// GET /api/companies/limits?companyId=...
export async function GET(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "Missing parameter: companyId" },
        { status: 400 }
      );
    }

    const { data, error } = await sb.rpc("get_company_limits", {
      p_company_id: companyId,
    });

    if (error) {
      console.error("❌ Error calling get_company_limits:", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Failed to load company limits" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: Array.isArray(data) ? data : [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error in GET /api/companies/limits:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

// PUT /api/companies/limits
export async function PUT(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const body = await request.json();
    const { limitId, limit_amount } = body || {};

    if (!limitId) {
      return NextResponse.json(
        { ok: false, error: "Missing parameter: limitId" },
        { status: 400 }
      );
    }

    if (typeof limit_amount !== "number") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid parameter: limit_amount" },
        { status: 400 }
      );
    }

    const { data, error } = await sb.rpc("update_company_limit", {
      p_limit_id: limitId,
      p_limit_amount: limit_amount,
    });

    if (error) {
      console.error("❌ Error calling update_company_limit:", error);
      return NextResponse.json(
        { ok: false, error: error.message || "Failed to update limit" },
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
  } catch (error: any) {
    console.error("❌ Error in PUT /api/companies/limits:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}