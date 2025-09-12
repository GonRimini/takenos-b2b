import { NextRequest } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    email: string
    id: string
  }
}

export async function validateAuthToken(request: NextRequest): Promise<{ user: { email: string; id: string } | null; error: string | null }> {
  try {
    // Obtener el token del header Authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "Token de autorización requerido" }
    }

    const token = authHeader.replace("Bearer ", "")
    
    // Validar el token con Supabase
    const supabase = supabaseServer()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: "Token inválido o expirado" }
    }

    if (!user.email) {
      return { user: null, error: "Email del usuario no disponible" }
    }

    return {
      user: {
        email: user.email,
        id: user.id
      },
      error: null
    }
  } catch (error) {
    console.error("Error validating auth token:", error)
    return { user: null, error: "Error interno de autenticación" }
  }
}

// Función para mapear emails (movida desde utils.ts para evitar dependencias circulares)
function getApiEmailForUser(displayEmail: string): string {
  if (displayEmail === "fermin@takenos.com") {
    return "geraldinebrisa2017@gmail.com"
  }
  return displayEmail
}

export async function getAuthenticatedUserEmail(request: NextRequest): Promise<{ email: string | null; error: string | null }> {
  const { user, error } = await validateAuthToken(request)
  
  if (error || !user) {
    return { email: null, error }
  }

  // Aplicar el mapeo de email si es necesario
  const mappedEmail = getApiEmailForUser(user.email)
  
  return { email: mappedEmail, error: null }
}
