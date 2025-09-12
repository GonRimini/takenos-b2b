import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { getAuthenticatedUserEmail } from "@/lib/auth-middleware"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación y obtener email del token
    const { email: userEmail, error: authError } = await getAuthenticatedUserEmail(request)
    
    if (authError || !userEmail) {
      return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 })
    }

    const supa = supabaseServer()
    
    const { data: withdrawals, error } = await supa
      .from("withdrawals")
      .select("*")
      .eq("requester_email", userEmail)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase query error:", error)
      return NextResponse.json({
        success: false,
        message: "Error al obtener los retiros pendientes",
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: withdrawals || []
    })

  } catch (error) {
    console.error("Error fetching pending withdrawals:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor"
    }, { status: 500 })
  }
}
