import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
