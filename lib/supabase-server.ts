import { createClient } from "@supabase/supabase-js"

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE!
  
  if (!url || !serviceRole) {
    throw new Error("Missing Supabase environment variables")
  }
  
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
